"use server";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// common-redirect:@/tools/prisma
var require_prisma = __commonJS({
  "common-redirect:@/tools/prisma"(exports2, module2) {
    module2.exports = require("./_common").prisma;
  }
});

// common-redirect:@/frontend/action_utils
var require_action_utils = __commonJS({
  "common-redirect:@/frontend/action_utils"(exports2, module2) {
    module2.exports = require("./_common").frontendAuth;
  }
});

// src/frontend/actions/CustomerRegister.ts
var CustomerRegister_exports = {};
__export(CustomerRegister_exports, {
  checkEmailUnique: () => checkEmailUnique,
  registerCustomer: () => registerCustomer
});
module.exports = __toCommonJS(CustomerRegister_exports);
var import_prisma = __toESM(require_prisma());
var import_action_utils = __toESM(require_action_utils());
var checkEmailUnique = (0, import_action_utils.withResult)(
  async (input) => {
    const count = await import_prisma.default.sysuser.count({
      where: { email: input.sysuser_email }
    });
    return { is_unique: count === 0 };
  }
);
var registerCustomer = (0, import_action_utils.withResult)(
  async (input) => {
    const normalizedName = input.sysuser_name.trim();
    if (!normalizedName) {
      throw new Error("\u8BF7\u586B\u5199\u59D3\u540D");
    }
    if (normalizedName.length < 2 || normalizedName.length > 50) {
      throw new Error("\u59D3\u540D\u957F\u5EA6\u9700\u5728 2 \u5230 50 \u4E2A\u5B57\u7B26\u4E4B\u95F4");
    }
    if (!input.sysuser_phone.trim()) {
      throw new Error("\u8BF7\u586B\u5199 WhatsApp \u53F7\u7801");
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRegex.test(input.sysuser_password)) {
      throw new Error("\u5BC6\u7801\u4E0D\u7B26\u5408\u590D\u6742\u5EA6\u8981\u6C42\uFF08\u9700\u81F3\u5C118\u4F4D\uFF0C\u5305\u542B\u5927\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u53CA\u7279\u6B8A\u7B26\u53F7\uFF09");
    }
    const existingEmail = await import_prisma.default.sysuser.findUnique({
      where: { email: input.sysuser_email }
    });
    if (existingEmail) {
      throw new Error("\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C\uFF0C\u8BF7\u66F4\u6362\u90AE\u7BB1\u6216\u76F4\u63A5\u767B\u5F55");
    }
    const result = await import_prisma.default.$transaction(async (tx) => {
      const normalizedEmail = input.sysuser_email.trim().toLowerCase();
      const generatedAccount = normalizedEmail;
      const newUser = await tx.sysuser.create({
        data: {
          account: generatedAccount,
          email: normalizedEmail,
          password: (0, import_action_utils.hashPassword)(input.sysuser_password),
          role: import_action_utils.UserRole.CUSTOMER,
          status: "ACTIVE",
          username: normalizedName,
          phone: input.sysuser_phone.trim()
        }
      });
      await tx.cart.create({
        data: {
          account: {
            connect: { id: newUser.id }
          }
        }
      });
      return newUser;
    });
    return {
      sysuser_id: result.id
    };
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkEmailUnique,
  registerCustomer
});
