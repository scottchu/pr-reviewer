// Plain-English, source-grounded narration. Color describes code changes, not safety.
export const storyCopy = {
 dispatch: [
  'This PR wants unfinished work to continue when explicitly enabled, without retrying forever. To support that, it {{added|adds a way to ask whether work may continue}}. Step 1 shows where the app first recognizes that request.',
  '{{modified|The command reader now separates two kinds of request}}. Previously, {{removed|all task requests went straight to verification}}. Now the app first recognizes {{added|a request to check whether work may continue}}, while still supporting requests to verify completed work.',
  'For a concrete example, task stop now calls the new handler. task verify still checks the task record as it did before. The diff removes {{removed|the one rule for every task request}} and adds {{added|a route for continuation checks}} plus {{added|a route for verification}}. This is a change in how requests are directed, not yet a decision to continue.',
  'Follow two requests: task stop takes {{added|the continuation-check route}}; task verify takes {{added|the verification route}}. Next we will follow the first request and see what information reaches the new handler.'
 ],
 caller: [
  'Recognizing a request is only the start. The app also needs to pass it to the code that can handle it. Step 2 follows {{added|the new handoff}} and explains what is passed in and what comes back.',
  '{{modified|The command reader}} now calls {{added|the new request handler}}. Those are run() and runTaskStop() in the graph. The highlighted green arrow is that new call; it connects two responsibilities rather than merely two files.',
  'Imagine asking task stop to check an unfinished task. {{added|The new request handler}} receives the command arguments, reads the Stop event, and returns a decision object. {{added|The command reader prints that answer}} as JSON. It passes on the answer; it does not decide by itself whether work should continue.',
  'You have followed a request into a handler and an answer back out. Next follow {{added|the code that makes the continuation decision}} to learn what can make that answer stop or continue.'
 ],
 decision: [
  'Continuing automatically would be risky if the task is already finished or cannot proceed. Step 3 shows how {{added|the new continuation check}} first reuses {{context|the existing task check}}, then applies more limits.',
  'The new decideTaskStop() function calls {{context|the existing task check}} named verifyTask(). That checks the declared task record. The continuation check is new; the task check it calls was already there.',
  'Suppose the task record says the task is complete. {{added|The new check returns a stop answer}} instead of creating another guard. Only when the existing result says continue does the code check the session, repeated requests, progress and continuation count. A record saying something is verified is not proof that the actual work is correct.',
  'There are two questions: does the record say work can proceed, and do {{added|the new continuation limits}} permit another attempt? Next follow what is saved so the next request can remember this attempt.'
 ],
 guard: [
  'The next request needs to remember earlier attempts without rewriting the task plan. Step 4 shows {{added|how the app saves a separate progress record}} and checks that the task has not changed while it was deciding.',
  '{{added|The saved progress record is replaced only after a consistency check}}. That is fs.renameSync(temp,guard) in the source. Immediately above it, the code checks the task record again before publishing the new guard.',
  'The app first writes and flushes a temporary file. It then {{added|checks that the task record still matches what it read}}. If the bytes or file identity changed, it stops rather than using the old decision. Only after that check does it replace the saved guard. The task plan and guard are separate files.',
  'Think of this as checking that the instructions did not change while you were preparing the answer. {{added|This check narrows a race window}}; it cannot prevent every later cancellation. Next inspect the rules that stop repeated attempts.'
 ],
 failure: [
  'Unfinished work must not mean endless retries. Step 5 shows {{added|a limit of four continuations}} and {{added|a requirement for new verified progress}}. Green means these rules were added, not that correctness has been proven.',
  '{{added|One rule refuses a fifth continuation}}; {{added|another requires new progress}}. These are two distinct reasons to stop: reaching the limit, or failing to move forward.',
  'For example, after four continuations, another request returns a stop answer. Before that limit, it also stops if earlier evidence disappears or no new evidence is added. {{added|Rewording a status message is not progress}}: the signatures are built from declared verified evidence.',
  'You can now tell the story: {{modified|requests are directed differently}}, a {{added|new handler}} asks for a decision, a {{added|separate progress record}} remembers the attempt, and {{added|new stopping rules}} limit repetition. Inspect the test changes to challenge coverage; this prototype has not rerun those tests.'
 ]
};

Object.assign(storyCopy, {
  compatibility: [
    "The command needs to be discoverable and compatible with the local hook configuration. {{modified|The surrounding setup code}} changes alongside the new continuation logic.",
    "Help now lists task stop. The configuration checks accept an empty trust entry, while still rejecting unsupported keys. {{modified|Release metadata moves from 0.3.16 to 0.3.17}} and the contract describes explicit opt-in.",
    "An empty hook state has no saved trust hash yet. {{modified|The changed condition only requires a hash when that entry contains fields}}. This compatibility change does not itself grant trust or register continuation.",
    "Installing the new release still leaves continuation disabled. The user must explicitly configure the local adapter. Compare {{modified|the setup and release changes}} in this group's files."
  ],
  tests: [
    "A continuation feature needs checks for both its decisions and its file adapter. {{added|The new test cases}} give the other green code concrete situations to handle.",
    "One file tests decision outcomes directly; another invokes the packaged command with task-owned files. {{added|They add cases for progress, replay, cancellation and unsafe files}} rather than only checking the happy path.",
    "For example, the first request may continue, but {{added|a repeated request without new progress must stop}}. Other cases check cancellation and guard identity. Select either test file to see its actual assertions.",
    "Tests included in a patch are evidence of what the author intends to check. {{context|This viewer has not run those tests}} and does not prove runtime adoption. Next read the documented experiment and limits."
  ],
  docs: [
    "People need to know how to enable the feature and what it cannot guarantee. {{added|The added usage and limitation notes}} connect the implementation to an explicit local experiment.",
    "The README and task-record guidance describe opt-in. Build, install and API documentation explain the adapter. The experiment records its scope and findings. {{added|Some large additions are copies of source code in documentation}}.",
    "A green line in an API example explains executable code elsewhere; it does not execute twice. {{modified|The guidance now distinguishes installation from explicit continuation setup}}. Open the six files in this group to see where each explanation lives.",
    "Someone installing Flow should not assume automatic continuation is enabled. The instructions require explicit setup and retain native-testing and semantic-acceptance limits. {{context|Those documented limits}} are part of the story, not missing implementation lines."
  ]
});
