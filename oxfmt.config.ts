import base from "@adamaho/nopeus-oxfmt-config";

export default {
  ...base,
  // Skills are distributed as reviewed text, including byte-for-byte upstream copies.
  ignorePatterns: ["packages/nopeus-skills/skills/**"],
};
