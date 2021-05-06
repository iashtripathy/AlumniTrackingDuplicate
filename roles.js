const AccessControl = require("accesscontrol");
const ac = new AccessControl();

exports.roles = (function() {
  ac.grant("alumni")
    .readOwn("profile")
    .updateOwn("profile")
    .updateOwn("profile")
    .deleteOwn("profile")


  ac.grant("admin")
    .extend("alumni")

    .updateAny("profile")
    .deleteAny("profile")

  return ac;
})();
