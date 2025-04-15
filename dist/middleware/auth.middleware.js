"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(req.query);
    try {
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.uuid;
        if (!token) {
            res.status(401).json({ message: "Authentication token missing" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, "123456");
        console.log(decoded);
        const user = yield user_model_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        //@ts-ignore
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ message: "Invalid or expired token" });
    }
});
exports.default = authMiddleware;
