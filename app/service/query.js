/**
 * 通用查询服务
 *
 * 把「哪些字段可以筛选、用什么方式筛选」交给 model 配置声明，
 * 由本服务在运行时读取并动态生成过滤条件，避免在 controller 中为
 * 每个字段手写一段过滤逻辑。
 *
 * 约定：查询参数值为 undefined 或 "" 时视为"不过滤"。
 */

/**
 * 由控件的 comType 推导默认过滤算子。
 * 需要在 searchOption 中显式指定时，用 filterType 覆盖。
 */
const OPERATOR_BY_COM_TYPE = {
  input: "like", // 输入框 → 模糊匹配
  select: "eq", // 下拉选择 → 精确匹配
  dynamicSelect: "eq", // 动态下拉（远程枚举）→ 精确匹配
  dateRange: "range", // 日期区间 → 范围匹配
};

module.exports = (app) => {
  const BaseService = require("@teribom/elpis").Service.Base(app);

  return class QueryService extends BaseService {
    /**
     * 按 api 路径，从项目配置中取出对应模块的字段 schema
     * @param {string} projKey 项目标识，取自 ctx.projKey
     * @param {string} api     模块的数据源 api，如 /api/proj/product
     * @returns {object} schema.properties，不存在时返回空对象
     */
    findSchemaProps(projKey, api) {
      const projConfig = this.app.service.project.get(projKey);
      if (!projConfig) {
        return {};
      }

      //菜单支持嵌套（group/subMenu），递归查找 api 匹配的模块
      const walk = (menu = []) => {
        for (const item of menu) {
          if (item.schemaConfig?.api === api) {
            return item.schemaConfig.schema;
          }
          const hit = walk(item.subMenu);
          if (hit) {
            return hit;
          }
        }
        return null;
      };

      return walk(projConfig.menu)?.properties ?? {};
    }

    /**
     * 按 schema 声明对数据集做动态过滤
     *
     * 注意这里遍历的是 schema 而非查询参数：只有声明了 searchOption 的字段
     * 才会参与过滤，未声明的参数（如 page/size）天然被忽略。
     *
     * @param {Array}  list        原始数据集
     * @param {object} query       查询参数，通常传 ctx.request.query
     * @param {object} schemaProps schema.properties，过滤规则的唯一来源
     * @returns {Array} 过滤后的数据集
     */
    applyFilters(list, query, schemaProps) {
      let result = list;

      for (const [key, props] of Object.entries(schemaProps)) {
        const option = props.searchOption;
        if (!option) {
          continue; //未声明为筛选项的字段，直接跳过
        }

        //显式 filterType 优先，否则按 comType 推导
        const operator =
          option.filterType ?? OPERATOR_BY_COM_TYPE[option.comType] ?? "eq";

        if (operator === "range") {
          //dateRange 组件发出的键名是 key_start / key_end，主键名本身不出现
          const start = query[`${key}_start`];
          const end = query[`${key}_end`];
          if (start || end) {
            result = result.filter(
              (item) =>
                (!start || item[key] >= start) && (!end || item[key] <= end),
            );
          }
          continue;
        }

        const rawValue = query[key];
        if (rawValue === undefined || rawValue === "") {
          continue; //空值视为不过滤
        }

        result = result.filter((item) =>
          this.matches(item[key], rawValue, operator),
        );
      }

      return result;
    }

    /**
     * 单字段匹配
     * @param {*} fieldValue 数据集中的字段值
     * @param {*} rawValue   查询参数值（URL 传递时统一为字符串）
     * @param {string} operator eq / like / in / range
     */
    matches(fieldValue, rawValue, operator) {
      switch (operator) {
        case "like":
          return String(fieldValue ?? "").includes(String(rawValue));
        case "in":
          return String(rawValue)
            .split(",")
            .map((it) => it.trim())
            .includes(String(fieldValue));
        case "eq":
        default:
          //统一转字符串比较，避免 "39.9" 与 39.9 的类型差异
          return String(fieldValue) === String(rawValue);
      }
    }
  };
};
