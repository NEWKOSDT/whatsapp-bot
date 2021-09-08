/* Copyright (C) 2020 Yusuf Usta.

Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.

WhatsAsena - Yusuf Usta
*/

const Asena = require("../Utilis/events");
const { spawnSync } = require("child_process");
const Config = require("../config");
const Language = require("../language");
const { checkImAdmin } = require("../Utilis/Misc");
const { warn, getEachWarn } = require("../Utilis/warn");
const Lang = Language.getString("system_stats");
let fm = true;

Asena.addCommand(
  { pattern: "alive", fromMe: fm, desc: Lang.ALIVE_DESC },
  async (message, match) => {
    return await message.sendMessage(Config.ALIVE);
  }
);

Asena.addCommand(
  { pattern: "sysd", fromMe: true, desc: Lang.SYSD_DESC },
  async (message, match) => {
    const child = spawnSync("neofetch", ["--stdout"]).stdout.toString("utf-8");
    await message.sendMessage("```" + child + "```");
  }
);

Asena.addCommand(
  { pattern: "warn ?(.*)", fromMe: fm, desc: "To warn", onlyGroup: true },
  async (message, match) => {
    if (match == 'list') {
      let msg = '';
      let users = await getEachWarn()
      if (!users) return await message.sendMessage('*Nothing to Display*')
      users.forEach(jid => {
        let { user, count, reason } = jid
        msg += `User   : ${user.split('@')[0]}\nWarn   : ${count}\nRemain : ${Config.WARN_COUNT - count}\nReason :${reason}\n\n`
      })
      return await message.sendMessage('```' + msg + '```')
    }
    if (!message.reply_message && !message.mention)
      return await message.sendMessage("*Give me a User*");
    let quoted = !message.reply_message ? undefined : message.quoted;
    let { user, count, reason } = await warn(message, match);
    if (reason == "reset") {
      return await message.sendMessage(
        "```" +
        `WARN RESET
User      : @${user.split("@")[0]}
Remaining : ${Config.WARN_COUNT - count}` +
        "```",
        { quoted, contextInfo: { mentionedJid: [user] } }
      );
    }
    if (count >= Config.WARN_COUNT) {
      let participants = await message.groupMetadata(message.jid);
      let im = await checkImAdmin(participants, message.client.user.jid);
      if (!im) return await message.sendMessage("*I am Not ADMIN*");
      let us = await checkImAdmin(participants, user);
      if (us) return await message.sendMessage("*User is ADMIN*");
      await message.sendMessage(Config.WARN_MSG, { quoted });
      return await message.groupRemove(message.jid, user);
    }
    return await message.sendMessage(
      "```" +
      `⚠️WARNING⚠️
User      : @${user.split("@")[0]}
Reason    :${reason}
Remaining : ${Config.WARN_COUNT - count} ` +
      "```",
      { quoted, contextInfo: { mentionedJid: [user] } }
    );
  }
);
