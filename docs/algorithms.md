# Core Algorithms & Queries

## SM-2 Pseudo-code (with spec scoring)

```
function calculateNextReview(state, attempt):
  # state: {ef, intervalDays, repetitions, nextReviewAt}
  # attempt: {mode, score, similarity, isPostTest}

  # Map spec scores (1-4) to SM-2 quality (2-5)
  # Choice: correct => 4; wrong => 2
  # Spell: 100%=>4, ≥85%=>3, ≥70%=>2, <70%=>1
  quality = mapScoreToQuality(attempt)

  if quality < 3:
    state.repetitions = 0
    state.intervalDays = 1
  else:
    if state.repetitions == 0:
      state.intervalDays = 1
    elif state.repetitions == 1:
      state.intervalDays = 6
    else:
      state.intervalDays = round(state.intervalDays * state.ef)
    state.repetitions += 1

  # EF update: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  q = clamp(quality, 0, 5)
  state.ef = state.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if state.ef < 1.3:
    state.ef = 1.3

  state.nextReviewAt = now() + days(state.intervalDays)

  # Priority rules
  # 🔴 P1: post-test failed
  # 🟠 P2: EF ≤ 1.6
  # 🟡 P3: overdue (now > nextReviewAt)
  # 🔵 P4: repetitions < 2
  if attempt.isPostTest and quality < 3:
    state.currentPriority = 1
  elif state.ef <= 1.6:
    state.currentPriority = 2
  elif now() > state.nextReviewAt:
    state.currentPriority = 3
  elif state.repetitions < 2:
    state.currentPriority = 4
  else:
    state.currentPriority = 4

  return state

function mapScoreToQuality(attempt):
  if attempt.mode == 'CHOICE':
    return (attempt.score == 4) ? 5 : 3  # 4→5; 2→3
  if attempt.mode == 'SPELL':
    sim = attempt.similarity
    if sim >= 100: return 5
    if sim >= 85: return 4
    if sim >= 70: return 3
    return 2
  # MIXED: derive per sub-mode or average
  return 3
```

## Smart Linker (tokenization + linking)

- Build Lexicon: preload `lemma` for selected `dialect` into memory (and Redis) with frequency and variants.
- Normalize: NFD for diacritics, lowercase, strip punctuation specific to dialect.
- Tokenize: ICU segmenter or greedy longest-match over lexicon n-grams (max length 5).
- Match Strategy:
  - Exact match first.
  - Fuzzy fallback: trigram similarity (`pg_trgm`), threshold from user preference (`spellingTolerance`, default 85).
  - Resolve collisions by longest-span wins, then highest similarity.
- Persist Links: write `SentenceWordLink(sentence_id, flashcard_id, startIndex, endIndex)`.

```
function linkSentence(text, dialectId, tolerance):
  lexicon = loadLexicon(dialectId)  # from flashcards.lemma
  tokens = tokenizeICU(text)
  links = []
  i = 0
  while i < len(tokens):
    best = null
    for n in range(5, 0, -1):
      span = join(tokens[i:i+n])
      if span in lexicon:
        best = {lemma: span, score: 1.0, length: n}
        break
      else:
        candidates = fuzzySearch(span, lexicon) # trigram/top-k
        if candidates[0].score*100 >= tolerance:
          best = {lemma: candidates[0].lemma, score: candidates[0].score, length: n}
          break
    if best:
      startIdx = tokens[i].start
      endIdx = tokens[i+best.length-1].end
      flashcardId = getFlashcardId(dialectId, best.lemma)
      links.append({flashcardId, startIdx, endIdx})
      i += best.length
    else:
      i += 1
  saveLinks(sentenceId, links)
  return links
```

## Priority Recommendation — SQL (PostgreSQL)

```
WITH stats AS (
  SELECT ucs.*, f.dialect_id,
         EXISTS (
           SELECT 1 FROM reviews r
           JOIN review_session s ON s.id = r.session_id
           WHERE r.user_id = $1
             AND r.flashcard_id = ucs.flashcard_id
             AND s.type = 'POST_TEST'
             AND r.score <= 2
         ) AS failed_post_test
  FROM user_card_stats ucs
  JOIN flashcards f ON f.id = ucs.flashcard_id
  WHERE ucs.user_id = $1
), ranked AS (
  SELECT
    stats.flashcard_id,
    stats.user_id,
    stats.ef,
    stats.repetitions,
    stats.next_review_at,
    CASE
      WHEN stats.failed_post_test THEN 1
      WHEN stats.ef <= 1.6 THEN 2
      WHEN stats.next_review_at IS NOT NULL AND now() > stats.next_review_at THEN 3
      WHEN stats.repetitions < 2 THEN 4
      ELSE 4
    END AS priority,
    CASE
      WHEN stats.failed_post_test THEN 'post-test failed'
      WHEN stats.ef <= 1.6 THEN 'low EF'
      WHEN stats.next_review_at IS NOT NULL AND now() > stats.next_review_at THEN 'overdue'
      WHEN stats.repetitions < 2 THEN 'new (<2 reps)'
      ELSE 'new'
    END AS reason
  FROM stats
)
SELECT *
FROM ranked
ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC
LIMIT $2;
```

- Fetch per-priority explicitly:

```
SELECT * FROM ranked WHERE priority = 1
UNION ALL
SELECT * FROM ranked WHERE priority = 2
UNION ALL
SELECT * FROM ranked WHERE priority = 3
UNION ALL
SELECT * FROM ranked WHERE priority = 4
ORDER BY priority, next_review_at ASC NULLS LAST;
```
