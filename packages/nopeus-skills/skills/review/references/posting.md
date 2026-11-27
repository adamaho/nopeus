# Posting a review to a pull request

The report is markdown in the conversation unless the human explicitly asks you
to post it, as in "review PR 80 and post it". A plain "review this" never posts:
publishing under someone's account is their decision each time.

When asked:

- Post one GitHub review of type Comment. Its body is the header, the Outcome
  line, any finding that has no line in the PR's diff, and `Examined`.
- Make each finding whose line is in the PR's diff an inline comment on that
  line. GitHub rejects inline comments elsewhere, so those stay in the body.
- Never approve or request changes. The verdict is text in the body, and the
  merge decision stays with a person.
- After fixes, post a new review; do not edit the earlier one.
- If posting is unavailable or fails, say so and give the markdown report.
