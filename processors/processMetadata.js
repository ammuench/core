/**
 * Given an event stream, extracts metadata such as game zero time and hero to slot/ID mappings.
 **/
function processMetadata(entries) {
  const hero_to_slot = {};
  const slot_to_playerslot = {};
  let game_zero = 0;
  let game_end = 0;
  const metaTypes = {
    DOTA_COMBATLOG_GAME_STATE(e) {
      // capture the replay time at which the game clock was 0:00
      // 5 is playing
      // https://github.com/skadistats/clarity/blob/master/src/main/java/skadistats/clarity/model/s1/GameRulesStateType.java
      if (e.value === 5) {
        game_zero = e.time;
      } else if (e.value === 6) {
        game_end = e.time;
      }
    },
    interval(e) {
      // check if hero has been assigned to entity
      if (e.hero_id) {
        // grab the end of the name, lowercase it
        const ending = e.unit.slice('CDOTA_Unit_Hero_'.length);
        // valve is bad at consistency and the combat log name could involve replacing camelCase with _ or not!
        // double map it so we can look up both cases
        const combatLogName = `npc_dota_hero_${ending.toLowerCase()}`;
        // don't include final underscore here since the first letter is always capitalized and will be converted to underscore
        const combatLogName2 = `npc_dota_hero${ending.replace(/([A-Z])/g, $1 =>
           `_${$1.toLowerCase()}`
        ).toLowerCase()}`;
        // console.log(combatLogName, combatLogName2);
        // populate hero_to_slot for combat log mapping
        hero_to_slot[combatLogName] = e.slot;
        hero_to_slot[combatLogName2] = e.slot;
        // populate hero_to_id for multikills
        // hero_to_id[combatLogName] = e.hero_id;
        // hero_to_id[combatLogName2] = e.hero_id;
      }
    },
    player_slot(e) {
      // map slot number (0-9) to playerslot (0-4, 128-132)
      slot_to_playerslot[e.key] = e.value;
    },
  };
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (metaTypes[e.type]) {
      metaTypes[e.type](e);
    }
  }
  return {
    game_zero,
    hero_to_slot,
    slot_to_playerslot,
    game_end,
  };
}
module.exports = processMetadata;
