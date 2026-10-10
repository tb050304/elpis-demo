const { serverStart } = require("@teribom/elpis");

//启动 elpis 服务
const app = serverStart({
  name: "ElpisDemo",
  homePage: "/view/project-list",
});
