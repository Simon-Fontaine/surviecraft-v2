const userCaptchaSchema = require("../../models/user-captcha-schema");

module.exports = async (member, instance) => {
  if (member.user.bot) return;

  let result = await userCaptchaSchema.findOne({
    guild_id: `${member.guild.id}`,
    user_id: `${member.user.id}`,
  });

  if (!result) {
    return;
  } else {
    await userCaptchaSchema.deleteOne({
      guild_id: `${member.guild.id}`,
      user_id: `${member.user.id}`,
    });
  }
};
