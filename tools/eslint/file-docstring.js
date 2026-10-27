/** ESLint rule: line 1 of every file is a one-line docstring that states the file's purpose. */

const MIN_LENGTH = 8;

function isOneLineDocstring(comment) {
  const text = comment.value.replace(/^\*/, "").trim();
  return comment.type === "Block" && comment.range[0] === 0 && comment.value.startsWith("*") && !comment.value.includes("\n") && text.length >= MIN_LENGTH;
}

function checkProgram(context) {
  const first = context.sourceCode.getAllComments()[0];
  if (first && isOneLineDocstring(first)) return;
  context.report({ loc: { line: 1, column: 0 }, messageId: "missing" });
}

function createRule(context) {
  return { Program: checkProgram.bind(null, context) };
}

export default {
  meta: { type: "problem", schema: [], messages: { missing: "Start the file with a one-line /** docstring */ that states its purpose." } },
  create: createRule,
};
