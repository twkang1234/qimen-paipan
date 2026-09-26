(() => {
  "use strict";

  const GAN_ELEMENT = {
    "甲":"木","乙":"木","丙":"火","丁":"火","戊":"土",
    "己":"土","庚":"金","辛":"金","壬":"水","癸":"水"
  };

  const ZHI_ELEMENT = {
    "子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火",
    "午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水"
  };

  const ELEMENTS = ["木","火","土","金","水"];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function parseLocalDateTime(value) {
    if (!value) throw new Error("請輸入出生日期與時間");
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) throw new Error("日期時間格式不正確");
    return {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: 0
    };
  }

  function formatSolar(solar) {
    if (!solar) return "—";
    if (typeof solar.toYmdHms === "function") return solar.toYmdHms();
    return [
      solar.getYear(), "-",
      pad(solar.getMonth()), "-",
      pad(solar.getDay()), " ",
      pad(solar.getHour()), ":",
      pad(solar.getMinute()), ":",
      pad(solar.getSecond ? solar.getSecond() : 0)
    ].join("");
  }

  function buildPillar(eight, type) {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const get = name => {
      const fn = eight[`get${cap}${name}`];
      return typeof fn === "function" ? fn.call(eight) : null;
    };

    return {
      key: type,
      ganZhi: get(""),
      gan: get("Gan"),
      zhi: get("Zhi"),
      hideGan: get("HideGan") || [],
      wuXing: get("WuXing") || "",
      naYin: get("NaYin") || "",
      shiShenGan: get("ShiShenGan") || "",
      shiShenZhi: get("ShiShenZhi") || [],
      diShi: get("DiShi") || "",
      xunKong: get("XunKong") || ""
    };
  }

  function visibleFiveElements(pillars) {
    const counts = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
    pillars.forEach(p => {
      if (GAN_ELEMENT[p.gan]) counts[GAN_ELEMENT[p.gan]]++;
      if (ZHI_ELEMENT[p.zhi]) counts[ZHI_ELEMENT[p.zhi]]++;
    });
    return counts;
  }

  function buildDaYun(eight, gender) {
    try {
      const yun = eight.getYun(Number(gender), 2);
      const all = yun.getDaYun(9);
      const cycles = all
        .filter(x => x.getIndex() > 0)
        .slice(0, 8)
        .map(x => ({
          ganZhi: x.getGanZhi(),
          startYear: x.getStartYear(),
          endYear: x.getEndYear(),
          startAge: x.getStartAge(),
          endAge: x.getEndAge(),
          xunKong: typeof x.getXunKong === "function" ? x.getXunKong() : ""
        }));

      return {
        forward: yun.isForward(),
        startYears: yun.getStartYear(),
        startMonths: yun.getStartMonth(),
        startDays: yun.getStartDay(),
        startHours: yun.getStartHour(),
        startSolar: formatSolar(yun.getStartSolar()),
        cycles
      };
    } catch (err) {
      return {
        error: err && err.message ? err.message : String(err),
        cycles: []
      };
    }
  }

  function getJieInfo(lunar) {
    const out = {};
    try {
      const prev = lunar.getPrevJie();
      if (prev) {
        out.prev = {
          name: prev.getName ? prev.getName() : "",
          solar: prev.getSolar ? formatSolar(prev.getSolar()) : ""
        };
      }
    } catch (_) {}
    try {
      const next = lunar.getNextJie();
      if (next) {
        out.next = {
          name: next.getName ? next.getName() : "",
          solar: next.getSolar ? formatSolar(next.getSolar()) : ""
        };
      }
    } catch (_) {}
    return out;
  }

  function cast(options) {
    if (typeof Solar === "undefined" || !Solar || typeof Solar.fromYmdHms !== "function") {
      throw new Error("八字曆法核心尚未載入，請確認網路或 lunar-javascript 核心是否可用");
    }

    const input = parseLocalDateTime(options.datetime);
    const gender = Number(options.gender) === 0 ? 0 : 1;
    const sect = Number(options.sect) === 1 ? 1 : 2;

    const solar = Solar.fromYmdHms(
      input.year, input.month, input.day,
      input.hour, input.minute, input.second
    );

    const lunar = solar.getLunar();
    const eight = lunar.getEightChar();
    if (typeof eight.setSect === "function") eight.setSect(sect);

    const pillars = [
      buildPillar(eight, "year"),
      buildPillar(eight, "month"),
      buildPillar(eight, "day"),
      buildPillar(eight, "time")
    ];

    const dayMaster = pillars[2].gan;
    const fiveElements = visibleFiveElements(pillars);
    const jie = getJieInfo(lunar);

    let lunarText = "";
    try {
      lunarText = `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    } catch (_) {
      lunarText = lunar.toString ? lunar.toString() : "";
    }

    return {
      input,
      gender,
      sect,
      solarText: formatSolar(solar),
      lunarText,
      pillars,
      dayMaster,
      dayMasterElement: GAN_ELEMENT[dayMaster] || "",
      fiveElements,
      taiYuan: typeof eight.getTaiYuan === "function" ? eight.getTaiYuan() : "",
      mingGong: typeof eight.getMingGong === "function" ? eight.getMingGong() : "",
      shenGong: typeof eight.getShenGong === "function" ? eight.getShenGong() : "",
      jie,
      daYun: buildDaYun(eight, gender)
    };
  }

  window.BaziCore = Object.freeze({
    cast,
    GAN_ELEMENT,
    ZHI_ELEMENT,
    ELEMENTS,
    version: "1.0"
  });
})();
