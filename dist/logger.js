"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const Logger = ({ clients, io }) => {
    console.log("total connections:", io.engine.clientsCount, "\n", "total clients:", clients.keys.length);
};
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map