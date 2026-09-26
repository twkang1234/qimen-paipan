(() => {
  "use strict";

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function parseDateTime(value) {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) throw new Error("請輸入完整出生日期與時間");
    return {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5])
    };
  }

  // iztro 的時辰序號：早子時 0 → 丑 1 → ... → 亥 11 → 晚子時 12
  function hourToTimeIndex(hour) {
    if (hour === 23) return 12;
    if (hour === 0) return 0;
    return Math.floor((hour + 1) / 2);
  }

  function dateString(input) {
    return `${input.year}-${input.month}-${input.day}`;
  }

  function normalizeStars(stars) {
    return (stars || []).map(s => ({
      name: s.name || "",
      type: s.type || "",
      brightness: s.brightness || "",
      mutagen: s.mutagen || "",
      scope: s.scope || ""
    }));
  }

  function normalizePalace(p, index) {
    return {
      index,
      name: p.name || "",
      isBodyPalace: !!p.isBodyPalace,
      isOriginalPalace: !!p.isOriginalPalace,
      heavenlyStem: p.heavenlyStem || "",
      earthlyBranch: p.earthlyBranch || "",
      majorStars: normalizeStars(p.majorStars),
      minorStars: normalizeStars(p.minorStars),
      adjectiveStars: normalizeStars(p.adjectiveStars),
      changsheng12: p.changsheng12 || "",
      boshi12: p.boshi12 || "",
      jiangqian12: p.jiangqian12 || "",
      suiqian12: p.suiqian12 || "",
      decadal: p.decadal ? {
        range: Array.isArray(p.decadal.range) ? p.decadal.range : [],
        heavenlyStem: p.decadal.heavenlyStem || "",
        earthlyBranch: p.decadal.earthlyBranch || ""
      } : null,
      ages: Array.isArray(p.ages) ? p.ages : []
    };
  }

  function cast(options) {
    if (!window.iztro || !iztro.astro || typeof iztro.astro.bySolar !== "function") {
      throw new Error("紫微斗數排盤引擎尚未載入，請確認網路連線後重新整理頁面");
    }

    const input = parseDateTime(options.datetime);
    const gender = String(options.gender) === "女" ? "女" : "男";
    const timeIndex = hourToTimeIndex(input.hour);

    const astrolabe = iztro.astro.bySolar(
      dateString(input),
      timeIndex,
      gender,
      true,
      "zh-TW"
    );

    return {
      input,
      gender,
      timeIndex,
      solarDate: astrolabe.solarDate || dateString(input),
      lunarDate: astrolabe.lunarDate || "",
      chineseDate: astrolabe.chineseDate || "",
      time: astrolabe.time || "",
      timeRange: astrolabe.timeRange || "",
      sign: astrolabe.sign || "",
      zodiac: astrolabe.zodiac || "",
      soulPalaceBranch: astrolabe.earthlyBranchOfSoulPalace || "",
      bodyPalaceBranch: astrolabe.earthlyBranchOfBodyPalace || "",
      soul: astrolabe.soul || "",
      body: astrolabe.body || "",
      fiveElementsClass: astrolabe.fiveElementsClass || "",
      palaces: (astrolabe.palaces || []).map(normalizePalace)
    };
  }

  window.ZiweiCore = Object.freeze({
    cast,
    hourToTimeIndex,
    version: "1.0"
  });
})();
