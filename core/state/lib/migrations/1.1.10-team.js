module.exports = async ({ node, states, printInfo }) => {
  printInfo('Try to remove node members from node.db...');

  const info = await states.node.read();
  await states.node.update(
    { did: info.did },
    {
      $unset: {
        members: true,
      },
    }
  );

  printInfo('Try to move node members to user.db...');

  const members = info.members || [];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    member.fullName = member.name;
    // eslint-disable-next-line no-await-in-loop
    await node.addUser({
      teamDid: info.did,
      user: member,
    });
  }
};
