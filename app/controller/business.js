module.exports = (app) => {
  //当前模块的数据源 api，与 router 中注册的路径一致
  const MODULE_API = "/api/proj/product";

  const sleep = async (time) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };

  const baseController = require("@teribom/elpis").Controller.Base(app);
  return class BusinessController extends baseController {
    async create(ctx) {
      const { product_name: productName, price, inventory } = ctx.request.body;
      await sleep(500);
      this.success(ctx, {
        product_id: Date.now(),
        product_name: productName,
        price,
        inventory,
      });
    }

    async update(ctx) {
      const {
        product_id: productId,
        product_name: productName,
        price,
        inventory,
      } = ctx.request.body;
      await sleep(500);
      this.success(ctx, {
        product_id: productId,
        product_name: productName,
        price,
        inventory,
      });
    }

    async remove(ctx) {
      const { product_id: productId } = ctx.request.body;
      await sleep(500);
      this.success(ctx, {
        projKey: ctx.projKey,
        product_id: productId,
      });
    }

    async get(ctx) {
      const { product_id: productId } = ctx.request.query;
      const productList = this.getProductList(ctx);
      const productItem = productList.find(
        (item) => item.product_id === productId,
      );
      this.success(ctx, productItem);
    }

    async getList(ctx) {
      await sleep(500);
      const { page, size } = ctx.request.query;

      //获取 proj_key
      //根据不同的 proj_key 做不一样的数据提取
      const queryService = this.app.service.query;
      //筛选规则由 model 配置中的 searchOption 声明，此处不再逐字段判断
      const schemaProps = queryService.findSchemaProps(
        ctx.projKey,
        MODULE_API,
      );
      const productList = queryService.applyFilters(
        this.getProductList(ctx),
        ctx.request.query,
        schemaProps,
      );

      this.success(ctx, productList, {
        total: productList.length,
        page,
        size,
      });
    }
    getProductEnumList(ctx) {
      // await sleep(500);
      this.success(ctx, [
        {
          //"全部"统一用空字符串表示，query 服务会将其视为不过滤
          label: `全部`,
          value: "",
        },
        {
          label: `${ctx.projKey}-《大前端面试宝典》`,
          value: `${ctx.projKey}-《大前端面试宝典》`,
        },
        {
          label: `${ctx.projKey}-《前端求职之道》`,
          value: `${ctx.projKey}-《前端求职之道》`,
        },
        {
          label: `${ctx.projKey}-《大前端全栈实践》`,
          value: `${ctx.projKey}-《大前端全栈实践》`,
        },
      ]);
    }
    getProductList(ctx) {
      return [
        {
          product_id: "1",
          product_name: `${ctx.projKey}-《大前端面试宝典》`,
          price: 39.9,
          inventory: 99999,
          create_time: "2023-07-03 20:23:22",
        },
        {
          product_id: "2",
          product_name: `${ctx.projKey}-《前端求职之道》`,
          price: 199,
          inventory: 1000000,
          create_time: "2023-02-14 22:12:44",
        },
        {
          product_id: "3",
          product_name: `${ctx.projKey}-《大前端全栈实践》`,
          price: 899,
          inventory: 18888,
          create_time: "2023-07-03 20:23:22",
        },
      ];
    }
  };
};
