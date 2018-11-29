# Pillar Pull Request (PR) Acceptance Criteria

## Ground Rules
### Expectations
Each contributing member of the development team will work together to ensure every PR conforms to the set of requirements defined below. When reviewing a PR please review with this guide in mind, citing a specific piece of criteria as missing if applicable. It is expected that this list will change as the needs of the team evolve.

> Responsibilities
> * Stories will be broken down into a 1 or 2 point maximum within Pivotal Tracker. We will attempt to have no ticket be larger than 1/2 to 1 full day of engineering effort
> * One ticket per branch per PR
> * Developers will merge their own work after PR approval
> * Developers will validate their work after deploy in the development environment before accepting the ticket in Pivotal Tracker
> * The PR will contain unit and integration tests as appropriate. In most cases we will also want to have tests written for downstream actions ie a notification is sent based on a model or state change
> * Threat Modeling and Tests that cover the threat model (coming soon)
> * Tests pass before requesting PR review
> * Do not use squash merges

## Code review process
### Expectations
Code review is a shared responsibility. We will strive to review and approve PRs within 2 hours during normal business hours. There are no tribes in review meaning any developer is capable of reviewing any other developers work.

> Review feedback will be given within the PR on github and issues raised will be resolved there unless a larger conversation is needed
> Please consider any post-merge comments that could prevent an issue or become a future improvement. Depending on the comment, a new PR could be raised or a story could be added to the icebox for future review.

## Code, commit message and labeling conventions
PR Titles will be used to generate release notes for development, staging, and production releases. Commit messages should be descriptive and reference the ticket within Pivotal

> PR Titles will be short, and sufficiently descriptive
> PR Body should include a link to the Pivotal Tracker link
> Standard PR merge process should be used. No Squash merges as the PR merge is used to identify PRs and collect them for release notes
