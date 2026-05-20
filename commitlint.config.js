export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
  },
};
