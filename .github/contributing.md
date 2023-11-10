# How To Contribute

## Triage Issues and Help Out in Discussions

Check out the issues and discussions for the project you want to help. For example, here are [the issues](https://github.com/openai-translator/bob-plugin-openai-translator/issues) board and [discussions](https://github.com/openai-translator/bob-plugin-openai-translator/discussions) for OpenAI Translator Bob Plugin. Helping other users, sharing workarounds, creating reproductions, or even poking into a bug a little bit and sharing your findings makes a huge difference.

## Creating an Issue

Thank you for taking the time to create an issue! 🥰

- **Reporting bugs**: One of the most valuable roles in open source is taking the time to report bugs helpfully.

- **Feature requests**: Check that there is not an existing issue or discussion covering the scope of the feature you have in mind.

We will do our best to solve the issues.

## Send a Pull Request

We always welcome pull requests! 🥰

**Before You Start**

Before you fix a bug, we recommend that you check whether **there's an issue that describes it**, as it's possible it's a documentation issue or that there is some context that would be helpful to know.

If you're working on a feature, then we ask that you **open a feature request issue first** to discuss with the maintainers whether the feature is desired - and the design of those features. This helps save time for both the maintainers and the contributors and means that features can be shipped faster. 

For typo fixes, it's recommended to batch multiple typo fixes into one pull request to maintain a cleaner commit history.

**Commit Conventions**

We use [Conventional Commits](https://www.conventionalcommits.org) for commit messages. Please read the guide through if you aren't familiar with it already.
Note that `fix:` and `feat:` are for actual code changes (that might affect logic). For typo or document changes, use `docs:` or `chore:` instead:
- ~~`fix: typo`~~ -> `docs: fix typo`

**Making the Pull Request**

If you don't know how to send a pull request, we recommend reading [the guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).

When sending a pull request, make sure your PR's title also follows the [Commit Convention](https://www.conventionalcommits.org).

If your PR fixes or resolves existing issues, please make sure you mention them in the PR description.

It's ok to have multiple commits in a single PR; you don't need to rebase or force push for your changes as we will use **`Squash and Merge`** to squash the commits into one commit when merging.

We do not add any commit hooks to allow for quick commits. But before you make a pull request, you should ensure that any lint/test scripts are passing.

In general, please also make sure that there are no unrelated changes in a PR. For example, if your editor has made any changes to whitespace or formatting elsewhere in a file that you edited, please revert these so it is more obvious what your PR changes. And please avoid including multiple unrelated features or fixes in a single PR.
If it is possible to separate them, it is better to have multiple PRs to review and merge separately. In general, a PR should do **one thing only**.

**Once You've Made a Pull Request**

Once you've made a pull request, we'll do our best to review it promptly.
If we assign it to a maintainer, then that means that person will take special care to review it and implement any changes that may be required.

We'll do our best to respond and review pull requests as soon as possible.
