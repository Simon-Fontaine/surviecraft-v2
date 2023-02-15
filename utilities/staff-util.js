const IDs = require("./ids");

const isStaff = (member) => {
  return (
    member.roles.cache.has(IDs.ADMIN_ROLE) ||
    member.roles.cache.has(IDs.RESP_ROLE) ||
    member.roles.cache.has(IDs.SUPERMODO_ROLE) ||
    member.roles.cache.has(IDs.MODERATOR_ROLE) ||
    member.roles.cache.has(IDs.DEV_ROLE) ||
    member.roles.cache.has(IDs.GUIDE_ROLE)
  );
};

const isHighStaff = (member) => {
  return member.roles.cache.has(IDs.ADMIN_ROLE) || member.roles.cache.has(IDs.RESP_ROLE);
};

const isModerator = (member) => {
  return (
    member.roles.cache.has(IDs.ADMIN_ROLE) ||
    member.roles.cache.has(IDs.RESP_ROLE) ||
    member.roles.cache.has(IDs.SUPERMODO_ROLE) ||
    member.roles.cache.has(IDs.MODERATOR_ROLE)
  );
};

module.exports = { isStaff, isHighStaff, isModerator };
