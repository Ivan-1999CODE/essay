(() => {
  'use strict';

  const line = ([en, zh]) => ({ en, zh });
  const combine = rows => ({
    en: rows.map(row => row[0]).join(' '),
    zh: rows.map(row => row[1]).join('')
  });

  function openingParts(template, sentence) {
    const fixed = template.split('...');
    const parts = [];
    let start = 0;
    for (let i = 0; i < fixed.length; i++) {
      const literal = fixed[i];
      const at = literal ? sentence.indexOf(literal, start) : sentence.search(/[.!?]*$/);
      if (at < start || (i === 0 && at !== 0)) return [{ text: sentence }];
      if (at > start) parts.push({ text: sentence.slice(start, at), slot: true });
      if (literal) parts.push({ text: literal });
      start = at + literal.length;
    }
    if (start < sentence.length) parts.push({ text: sentence.slice(start) });
    return parts;
  }

  function fillGroup(group, source, side) {
    const materials = group.materials;
    function addRow(row, original) {
      const sentence = line(row);
      for (const [wh, en, zh] of row.slice(2)) {
        const earlier = materials.find(item => item.wh === wh && item.en.toLowerCase() === en.toLowerCase());
        const item = { wh, en, zh, sentence };
        if (original) item.original = true;
        if (earlier) Object.assign(earlier, item);
        else materials.push(item);
      }
    }
    source.model.forEach(row => addRow(row, true));
    source.extra.forEach(row => addRow(row, false));
    materials.forEach((item, index) => { item.id = (side === 0 ? 'A-' : 'B-') + index; });
    group.model = combine(source.model);
    group.combined = line(source.combined || source.model[0]);
    if (source.label) group.label = source.label;
    if (source.question) group.question = source.question;
  }

  function prepare(topic, chapters) {
    chapters.forEach((chapter, index) => {
      const track = topic.tracks[index];
      track.focuses = chapter.focuses;
      track.openings = chapter.openings.map(([label, template, ...examples]) =>
        ({ label, template, examples: examples.map(row => ({ ...line(row), parts: openingParts(template, row[0]) })) }));
      chapter.groups.forEach((source, gi) => fillGroup(track.groups[gi], source, gi));
      track.bonuses = chapter.bonuses.map(([title, a, b, en, zh, why]) => ({
        title, a: line(chapter.groups[0].model[a]),
        b: line(chapter.groups[1].model[b]), en, zh, why
      }));
    });
  }

  window.TopicMaterialData = { prepare };
})();
