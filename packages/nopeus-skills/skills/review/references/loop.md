# The review-and-fix loop

Run this loop when the human asks for the findings to be fixed, and for every
task inside [orchestrate](../../orchestrate/SKILL.md). It keeps three roles
apart, because each one's value depends on not being another:

- **Reviewers** find problems and never edit.
- **Implementers** fix problems and never review their own fix.
- **The coordinator** does neither. It dispatches both and decides when to stop.

Each round:

1. **Review.** Coordinate reviewers as [the skill](../SKILL.md) describes, then
   validate.
2. **Decide.** A Clean verdict ends the loop.
3. **Fix.** Send the validated findings, with the report paths, to an
   implementer: the agent that wrote the change,
   in its existing session, when there is one, because it already knows the
   code; otherwise a fresh one. Use one implementer unless the findings touch
   separate files, so fixes do not collide. Have it load
   [audit](../../audit/SKILL.md) and make the smallest change that closes each
   finding. A fix is where complexity creeps in: told that a value can be
   absent, an implementer adds three guards where one belongs.
4. **Check.** The implementer reruns the checks its fixes could affect and
   reports, in a few lines, what it changed, what it declined and why, and the
   results.

Then review again, with fresh reviewers, scoped to the fixes:

- Check each earlier finding off: fixed, declined with a reason, or still open.
- Review the fixes themselves through the lenses that apply, and through
  `audit`, so an over-built fix is caught before it lands.
- Make sure the fixes did not harm anything else: trace the callers of what they
  touched and rerun the checks they could affect.
- Weigh the implementer's evidence against a finding honestly and withdraw the
  finding when the evidence holds. Being right matters more than being
  consistent.
- Do not reopen settled findings or raise new Notes on code the fixes did not
  touch.

Findings close by severity:

- **Critical:** fixed or withdrawn. The implementer cannot decline it.
- **Warning:** fixed, or declined by the implementer with a reason. A declined
  Warning goes to the human to accept or reject.
- **Note:** the implementer's call. It applies the ones it agrees with, lists
  the ones it skipped, and they are not re-reviewed.

Stop the loop and go to the human, with both sides' evidence, when:

- a Critical is still open after three rounds, since more rounds will not settle
  a disagreement that three did not;
- a fix would change agreed behavior, scope, or a contract, which is the
  human's decision and not the implementer's;
- a round makes no progress and the same findings come back.

Outside `orchestrate`, the loop edits the working tree and does not commit. End
with the last report, a list of what was changed, and anything left open.
