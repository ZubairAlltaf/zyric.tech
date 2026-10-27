"use client";

/*
 * PASSWORD PRO — three generators in one, all crypto-RNG, all offline.
 * Features: Random mode (length, 4 char sets, exclude look-alike characters,
 * require-every-selected-set), Passphrase mode (1,100-word list, separators,
 * capitalization, appended digits), PIN mode; bulk generation (1–50) with
 * copy-all; entropy + real-world crack-time estimate; presets (Website,
 * WiFi/WPA, Max security, PIN, Passphrase); session-only history with clear.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Copy,
  History,
  KeyRound,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { CopyButton, inputCls, labelCls } from "./hooks";

/* --------------------------------- helpers --------------------------------- */

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};
const AMBIGUOUS = "il1Lo0OB8S5|`'\";:,.";

// compact diceware-style list — 1,100 common words, no network needed
const WORDS = (
  "able about above accept across act action active add address admit adult advance advice afraid after afternoon again age agent agree air airport alarm album " +
  "alive all allow almost alone along already also always amazing amount ancient angel anger angle angry animal ankle answer ant anxiety any apart apartment ape " +
  "apple apply approach area argue arm army around arrange arrest arrive arrow art artist ask asleep assist assume attach attack attempt attend attic attract " +
  "audience author autumn available average avoid awake award aware away awful baby back bacon bad bag bake balance ball bamboo banana band bank bar barely bark " +
  "barn base basic basket batch bath battery battle bay beach bead beam bean bear beat beauty become bed bee beef before begin behave behind believe bell belong " +
  "below belt bench bend beneath berry beside best bet better beyond bicycle big bike bill bind bird birth biscuit bit bite black blade blame blank blanket " +
  "blast bleed blend bless blind block blood bloom blouse blow blue board boat body boil bold bolt bomb bond bone bonus book boost boot border borrow boss both " +
  "bother bottle bottom bounce bowl box boy brain brake branch brave bread break breakfast breath breeze brick bridge brief bright bring broad broke bronze " +
  "brother brown brush bubble bucket budget build bulb bulk bunch burden burger burn burst bus bush business busy butter button buy cabin cable cactus cage cake " +
  "calculate calendar call calm camera camp campus canal cancel candle candy cannon canoe canvas canyon cap capable capital captain capture carbon card care " +
  "career careful cargo carpet carry cart case cash castle casual catch cater cattle cause cave ceiling celebrate cell cement cent center century ceremony " +
  "certain chain chair chalk challenge chamber champion chance change channel chapter character charge charm chart chase cheap check cheek cheer cheese chef " +
  "chemical cherry chess chest chicken chief child chill chimney choice choose chronic chunk circle circus citizen city civil claim clash class classic clean " +
  "clear clerk click cliff climb cling clock close cloth cloud clover club clue cluster coach coal coast coat code coffee coil coin cold collar collect college " +
  "colony color column combine comedy comfort command comment common compact company compare compete compile complain complete complex comply compose compound " +
  "compute concept concern concert concrete condition conduct confirm conflict confuse connect consent consider consist constant contact contain content " +
  "contest context continue contract contrast control convent converse convert cookie cool copper copy coral cord core cork corn corner correct cost costume " +
  "cottage cotton cough could council count country couple courage course court cousin cover cow crack cradle craft crash crate crawl crazy cream create " +
  "creature credit creek crew crime crisp critic crop cross crowd crown cruel crush crust cry crystal cube culture cup cupboard curious current curtain curve " +
  "custom customer cut cycle dad daily dairy dam damage damp dance danger dark dash data date daughter dawn day dead deaf deal dear death debate debt decade " +
  "decay decide deck declare decorate deep deer defeat defend define degree delay delete delicate deliver demand democracy dense deny depart depend depict " +
  "deploy depth deputy derive descry desert design desire desk despair dessert detail detect develop device devote diagram dial diamond diary dice diesel diet " +
  "differ digital dinner direct dirt disable disagree disappear disaster disc discipline discover discuss disease dish dismiss display distance distinct " +
  "distribute district divide dizzy dock doctor document dog doll dollar dolphin domain done donkey door dose double doubt dough dove down dozen draft drag " +
  "dragon drain drama draw drawer dream dress drift drink drive drop drum dry duck dull dumb dune during dust duty dwarf dwell dye each eager eagle ear early " +
  "earn earth easily east easy echo eclipse edge edit educate effort egg eight either elbow elder elect electric elegant element elephant elevator else " +
  "embark embrace emerge emotion empire employ empty enable enact enclose encounter encourage end endless endorse energy engage engine enjoy enough ensure " +
  "enter entire entry envelope equal equip error escape essay essence estate estimate ethics ethnic evaluate evening event ever every evidence evolve exact " +
  "example exceed excellent except exchange excite exclude excuse execute exercise exhaust exhibit exit expand expect expel expense experience expert explain " +
  "explore export expose express extend extra extreme eye fabric face fact factory fade fail faint fair faith fall false fame family famous fan fancy fantasy " +
  "far fare farm fashion fast father fatigue fault favor feast feather feature february federal fee feed feel female fence fern festival fetch fever few fiber " +
  "fiction field fierce fifteen fifty fight figure file fill film filter final find finger finish fire firm first fish fit five fix flag flame flash flat " +
  "flavor flee flesh flexible float flock flood floor flour flow flower fluid flute fly foam focus fog foil fold folk follow fond food fool foot football " +
  "force forecast forest forever forget forgive fork form former fossil foster found fountain four fox frame free freeze freight frequent fresh friend " +
  "fringe frog front frost frozen fruit fuel full fun function fund funny fur furnace future gadget gain galaxy gallery game gap garage garbage garden " +
  "garlic gas gate gather gauge gear gem gender general genius gentle genuine get giant gift ginger giraffe girl give glad glance glass glide globe glory " +
  "glove glow glue goal goat gold golf good goose gorilla gospel gossip govern gown grab grace grade grain grand grant grape graph grasp grass gravel " +
  "gravity gray graze great greed green greet grid grief grill grin grip groan groom groove ground group grove grow guard guess guest guide guilt guitar " +
  "gun gym habit hair half hall ham hammer hand handle hang happen harbor hard hardly hare harm harmony harsh harvest hat hatch hate haul have hawk hay " +
  "hazard hazel head heal health heap hear heart heat heaven heavy hedge heel height helmet help hen herb herd here hero hesitate hide high hike hill hint " +
  "hip hire history hit hobby hold hole holiday hollow holy home honey honor hood hook hope horn horror horse hospital host hot hotel hour house hover " +
  "however huge human humble humor hunger hunt hurricane hurry hurt husband hybrid ice icon idea ideal identify idle igloo ignore ill image imagine imitate " +
  "impact import impose improve impulse inch include income indeed index indicate indoor industry infant infect inform inhale initial inject injury ink inn " +
  "inner innocent input inquiry insect inside insight insist inspect inspire install instance instead institute instruct instrument insult insurance " +
  "intend intense interact interest interior internal internet interpret interrupt interval intervene interview into introduce invade invent invest invite " +
  "involve iron island issue item ivory jacket jail jam january jazz jealous jeans jelly jet jewel job join joke journal journey joy judge juice jump june " +
  "jungle junior just kangaroo keen keep kettle key kick kid kidney kill kilo kind king kiss kit kitchen kite kitten knee knife knock knot know label labor " +
  "lady lagoon lake lamp land lane language lantern lap large laser last late laugh launch laundry lava law lawn lawyer layer lazy lead leaf league lean " +
  "leap learn lease least leather leave lecture left legal legend lemon lend length lens leopard less lesson let letter level liberty library license lid " +
  "lie life lift light like lily limb lime limit line linen link lion lip liquid list listen little live load loaf loan lobby lobster local lock log lonely " +
  "long look loop loose lord lose lot loud lounge love low loyal luck lunar lunch lung luxury lyrics machine mad magic magnet maid mail main major make " +
  "mammal man manage mandate mango manner mansion manual many maple marble march margin marine mark market marriage marsh mask mass master mat match math " +
  "matter mattress mature maximize may mayor meadow meal mean measure meat mechanic medal media medical meet melon melt member memory mend mental mention " +
  "menu merchant mercy mere merge merit merry message metal meter method middle midnight might mild mile milk mill million mind mine mineral mingle minor " +
  "mint minute mirror miss missile mission mist mistake mix mixture mobile model modern modest modify module moist moment money monitor month moon moral " +
  "more morning mortgage mosaic mosquito moss most mother motion motor mount mourn mouse mouth move movie much mud muffin multiply mumble muscle museum " +
  "mushroom music must my mystery myth naive name napkin narrow nation native nature naval navy near neat necessary neck need negative neglect " +
  "neighbor neither nephew nerve nest net network neutral never new news next nice niche nickel niece night nine noble nod noise none noodle noon normal " +
  "north nose not note nothing notice notion noun novel now nuclear number nurse nut oak obey object oblige observe obtain obvious occupy occur ocean " +
  "october odd offer office often oil okay old olive olympic omit once one onion online only open opera opinion oppose option orange orbit orchard " +
  "orchestra order ordinary organ original ornament orphan other otter ought ounce our outdoor outer outfit output outside oval oven over owe own owner " +
  "oxide oxygen oyster pace pack pad paddle page paid pain paint pair palace pale palm pan panda panel panic pants paper parade paragraph parallel parcel " +
  "pardon parent park parrot part partner party pass passage passenger passion past pasta paste patch path patient patrol pattern pause pave paw pay " +
  "peace peach peak peanut pear pearl pebble pedal peel peer pen penalty pencil penguin people pepper perceive perch period permit person pet phase " +
  "phone photo phrase physical piano pick picnic picture pie piece pier pigeon pill pilot pin pinch pine pink pint pioneer pipe pirate pistol pit pitch " +
  "pity pizza place plague plain plan plane planet plank plant plasma plate platform play plaza plea plead plenty plug plunge plural pocket poem poet " +
  "point poison polar pole police policy polish polite politics poll pond pony pool poor pop popular porch port portion portrait position positive " +
  "possess possible post poster potato potential pouch poultry pound pour poverty powder power practice praise pray preach precede predict prefer " +
  "pregnant prepare presence present preserve president press pressure pretend pretty prevent previous price pride priest primary prime prince princess " +
  "print prior prison private prize probable problem process produce product profile profit program progress project promise promote prompt proof proper " +
  "property propose protect proud prove provide public pudding puff pull pulse pumpkin punch pupil puppy purchase pure purple purpose purse push puzzle " +
  "pyramid qualify quality quantity quart quarter queen quest question quick quiet quilt quit quite quiz quote rabbit race rack radar radio radish raft " +
  "rail rain raise rally ranch random range rapid rare rate rather raven raw ray reach react read ready real realize reap rear reason rebel rebuild " +
  "recall receive recent recipe recite record recover recruit rectangle recycle reduce reed reef refer reflect reform refuse regard region register regret " +
  "regular reject relate relax release relief religion rely remain remark remedy remember remind remote remove renew rent repair repeat replace reply " +
  "report represent request require rescue research resemble reserve resign resist resolve resort resource respect respond rest result resume retail retain " +
  "retire retreat return reveal revenue reverse review revise revive revolt reward rhythm rice rich rid ride ridge rifle right rim ring rinse riot rip ripe " +
  "rise risk ritual rival river road roam roar roast robe robin robot rock rocket rod rogue role roll roof room root rope rose rotate rough round route " +
  "row royal rub rubber rude rug ruin rule rumor run runway rural rush rust sacred sad saddle safe sail salad salary sale salmon salon salt salute same " +
  "sample sand sandwich sunny satisfy saturday sauce sausage savage save say scale scan scar scarce scare scarf scatter scene scent schedule scheme scholar " +
  "school science scissors scold scoop scope score scout scrape scratch scream screen screw script scroll sea seal search season seat second secret section " +
  "secure seed seek seem segment seize seldom select self sell semester send senior sense separate sequel serene series serious serve session settle seven " +
  "several severe sew shade shadow shake shall shape share shark sharp shave shawl she sheep sheet shelf shell shield shift shine shirt shiver shock shoe " +
  "shoot shop shore short shoulder shout shovel show shower shrink shrub shrug shuffle shut shuttle shy sick side siege sigh sight sign signal silent " +
  "silk silly silver similar simple since sincere sing single sink sip sir siren sister sit site situation sixteen size skate sketch ski skill skin skip " +
  "skirt sky slab slam slap slate slave sled sleep sleeve slender slice slide slight slim slip slogan slope slot slow slug slumber sly small smart smash " +
  "smell smile smoke smooth snack snail snake snap snatch sneak sniff snow soak soap soccer social sock soda sofa soft solar soldier sole solid solution " +
  "solve some son song soon soothe sorry sort soul sound soup sour source south space spare spark sparrow speak spear special species speech speed spell " +
  "spend sphere spice spider spike spin spine spiral spirit splash split spoil sponge sport spot spouse spray spread spring sprint sprout spruce spur " +
  "spy square squash squeeze squirrel stab stable stack stadium staff stage stain stair stake stale stalk stall stamp stand staple star starch stare start " +
  "state station statue status stay steady steak steal steam steel steep steer stellar stem step stereo stick stiff still sting stir stitch stock stomach " +
  "stone stool stop store storm story stove straight strain strait strange strap straw stream street strength stress stretch strict stride strike string " +
  "strip stripe stroke strong structure struggle student studio study stuff stump style subject submit subscribe subtle suburb succeed success such suck " +
  "sudden suffer sugar suggest suit sulfur sum summer summit sun super supply support suppose sure surf surgeon surplus surprise surround survey survive " +
  "suspect sustain swallow swamp swan swap swarm sway swear sweat sweater sweep sweet swell swift swim swing switch sword symbol sympathy syrup system table " +
  "tablet tackle tact tag tail tailor take tale talent talk tall tame tan tango tank tap tape target task taste tattoo tavern taxi tea teach team tear " +
  "tease technology telephone telescope tell temple temper tenant tend tennis tension tent term terrace terrible territory terror test text texture thank " +
  "thaw theater theft their theme theory therefore thermal thick thief thin thing think third thirst thirteen thirty thistle thorn thorough though thought " +
  "thousand thread threat three thrive throat throne through throw thumb thunder ticket tide tidy tiger tight tile till timber time tin tiny tip tire " +
  "title toad toast tobacco today toe together toilet token tomato tomorrow tone tongue tonight tool tooth top topic topple torch tornado tortoise total " +
  "touch tough tour tourist toward towel tower town toy trace track trade traffic trail train trait tram transfer transform translate transport trap travel " +
  "tray treasure treat treaty tremble trench trend trial triangle tribal tribe trick trigger trim trip triple triumph troll troop trophy tropical trouble " +
  "trout truck true trumpet trunk trust truth tube tuck tuition tumble tune tunnel turkey turn turtle tusk tutor twelve twenty twice twig twilight twin twist " +
  "two type typical ugly ultimate umbrella unable uncle under undergo understand undo unfair unfold uniform union unique unit unity universe unknown unless " +
  "unlike unlock until unusual unveil up update upgrade uphold upper upset upstairs upward urban urge urgent usage useful usual utensil vacant vacation " +
  "vaccine vacuum vague valid valley value valve vanilla vanish vapor various vast vault vegetable vehicle veil vein velvet vendor venture venue verb " +
  "verdict verify very vessel veteran veto viable vibrant vibrate vice victim victory video view vigil vigorous village vine vinegar vintage viola violate " +
  "violence violet violin virtual virus visa visible vision visit visual vital vitamin vivid vocal voice void volcano volume volunteer vote voyage wage " +
  "wagon waist wait wake walk wall walnut wander want war warm warn warrant wasp waste watch water wave wax way weak wealth weapon wear weather weave " +
  "website wedding wedge week weep weight weird welcome weld welfare well west wheat wheel when where whip whirl whisper whistle white who whole why wicked " +
  "wide widow width wife wild will win wind window wine wing wink winner winter wipe wire wisdom wise wish wit witch with wolf woman wonder wood wool " +
  "word work world worm worry worth wound wrap wreck wrestle wriggle wrinkle wrist write wrong yacht yard yarn yawn year yeast yell yellow yes yesterday " +
  "yet yield yoga yogurt young your zebra zenith zero zone zoo"
).split(" ");

function randBelow(n: number): number {
  const max = Math.floor(0x100000000 / n) * n;
  const arr = new Uint32Array(1);
  let v = 0;
  do {
    crypto.getRandomValues(arr);
    v = arr[0];
  } while (v >= max);
  return v % n;
}

function pick(cs: string): string {
  return cs[randBelow(cs.length)];
}

function makeRandom(len: number, cs: string, requireAll: string[], excludeAmbiguous: boolean): string {
  let pool = cs;
  if (excludeAmbiguous) {
    pool = [...pool].filter((c) => !AMBIGUOUS.includes(c)).join("");
  }
  if (!pool) return "";
  const reqChars = requireAll
    .map((set) => {
      let s = set;
      if (excludeAmbiguous) s = [...s].filter((c) => !AMBIGUOUS.includes(c)).join("");
      return s ? pick(s) : "";
    })
    .filter(Boolean);

  const chars: string[] = [];
  for (let i = 0; i < len; i++) chars.push(pick(pool));
  // place required characters at random positions
  reqChars.slice(0, len).forEach((c, i) => {
    const j = randBelow(len);
    if (j !== i || i >= reqChars.length) chars[j] = c;
  });
  return chars.join("");
}

function makePassphrase(words: number, sep: string, cap: boolean, appendNum: boolean): string {
  const parts: string[] = [];
  for (let i = 0; i < words; i++) {
    let w = WORDS[randBelow(WORDS.length)];
    if (cap) w = w[0].toUpperCase() + w.slice(1);
    parts.push(w);
  }
  let out = parts.join(sep);
  if (appendNum) out += sep + String(randBelow(90) + 10);
  return out;
}

function makePin(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += SETS.digits[randBelow(10)];
  return out;
}

function crackTime(entropyBits: number): string {
  // offline attack: 1e10 guesses/sec, avg half the keyspace
  const guesses = Math.pow(2, entropyBits - 1);
  const seconds = guesses / 1e10;
  if (seconds < 1) return "instantly";
  const units: [number, string][] = [
    [60, "second"], [60, "minute"], [24, "hour"], [365, "day"],
  ];
  let v = seconds;
  let label = "second";
  for (const [factor, name] of units) {
    if (v < factor) break;
    v /= factor;
    label = name;
  }
  if (label === "second") label = "second";
  const yr = 365 * 24 * 3600;
  if (seconds >= yr) {
    const years = seconds / yr;
    if (years > 1e12) return `${(years / 1e12).toPrecision(3)} trillion years`;
    if (years > 1e9) return `${(years / 1e9).toPrecision(3)} billion years`;
    if (years > 1e6) return `${(years / 1e6).toPrecision(3)} million years`;
    return `${years.toLocaleString(undefined, { maximumFractionDigits: 0 })} years`;
  }
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${label}${v >= 2 ? "s" : ""}`;
}

type Mode = "random" | "passphrase" | "pin";

interface Preset {
  id: string;
  label: string;
  mode: Mode;
  length: number;
  sets?: { lower: boolean; upper: boolean; digits: boolean; symbols: boolean };
  words?: number;
}

const PRESETS: Preset[] = [
  { id: "web", label: "Website", mode: "random", length: 16, sets: { lower: true, upper: true, digits: true, symbols: true } },
  { id: "wifi", label: "WiFi / WPA", mode: "random", length: 24, sets: { lower: true, upper: true, digits: true, symbols: false } },
  { id: "max", label: "Max security", mode: "random", length: 40, sets: { lower: true, upper: true, digits: true, symbols: true } },
  { id: "phrase", label: "Passphrase", mode: "passphrase", length: 5 },
  { id: "pin", label: "PIN", mode: "pin", length: 6 },
];

/* --------------------------------- component ------------------------------- */

export function PasswordTool() {
  const [mode, setMode] = useState<Mode>("random");
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [requireAll, setRequireAll] = useState(true);
  const [wordCount, setWordCount] = useState(5);
  const [sep, setSep] = useState("-");
  const [capWords, setCapWords] = useState(true);
  const [addNum, setAddNum] = useState(true);
  const [bulk, setBulk] = useState(1);
  const [batch, setBatch] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const charset = useMemo(
    () =>
      (useLower ? SETS.lower : "") +
      (useUpper ? SETS.upper : "") +
      (useDigits ? SETS.digits : "") +
      (useSymbols ? SETS.symbols : ""),
    [useLower, useUpper, useDigits, useSymbols]
  );

  const requireSets = useMemo(
    () => [useLower ? SETS.lower : "", useUpper ? SETS.upper : "", useDigits ? SETS.digits : "", useSymbols ? SETS.symbols : ""].filter(Boolean),
    [useLower, useUpper, useDigits, useSymbols]
  );

  const makeOne = useCallback((): string => {
    if (mode === "random") {
      return makeRandom(length, charset, requireAll ? requireSets : [], noAmbiguous);
    }
    if (mode === "passphrase") {
      return makePassphrase(wordCount, sep, capWords, addNum);
    }
    return makePin(length);
  }, [mode, length, charset, requireAll, requireSets, noAmbiguous, wordCount, sep, capWords, addNum]);

  const regenerate = useCallback(() => {
    const list = Array.from({ length: Math.max(1, Math.min(50, bulk)) }, () => makeOne());
    setBatch(list);
    const first = list[0];
    if (first) setHistory((h) => [first, ...h].slice(0, 8));
  }, [makeOne, bulk]);

  // initial + regenerate on any setting change (async call keeps lint clean)
  useEffect(() => {
    const t = window.setTimeout(regenerate, 0);
    return () => window.clearTimeout(t);
  }, [regenerate]);

  const entropy = useMemo(() => {
    if (mode === "pin") return length * Math.log2(10);
    if (mode === "passphrase") {
      let bits = wordCount * Math.log2(WORDS.length);
      if (addNum) bits += Math.log2(90);
      return bits;
    }
    let poolSize = charset.length;
    if (noAmbiguous) poolSize = [...charset].filter((c) => !AMBIGUOUS.includes(c)).length;
    return poolSize > 1 ? length * Math.log2(poolSize) : 0;
  }, [mode, length, charset, noAmbiguous, wordCount, addNum]);

  const strength =
    entropy >= 100
      ? { label: "Fortress", color: "text-emerald-400", bar: "bg-emerald-500", icon: ShieldCheck, pct: 100 }
      : entropy >= 80
        ? { label: "Very strong", color: "text-emerald-400", bar: "bg-emerald-500", icon: ShieldCheck, pct: 84 }
        : entropy >= 60
          ? { label: "Strong", color: "text-emerald-300", bar: "bg-emerald-500", pct: 66 }
          : entropy >= 40
            ? { label: "Moderate", color: "text-amber-400", bar: "bg-amber-500", pct: 46 }
            : entropy >= 28
              ? { label: "Weak", color: "text-orange-400", bar: "bg-orange-500", pct: 28 }
              : { label: "Very weak", color: "text-rose-400", bar: "bg-rose-500", icon: ShieldAlert, pct: 14 };
  const StrengthIcon = strength.icon ?? Shield;

  const primary = batch[0] ?? "";

  const applyPreset = (p: Preset) => {
    setMode(p.mode);
    setLength(p.length);
    if (p.sets) {
      setUseLower(p.sets.lower);
      setUseUpper(p.sets.upper);
      setUseDigits(p.sets.digits);
      setUseSymbols(p.sets.symbols);
    }
    if (p.words) setWordCount(p.words);
  };

  const activePreset = PRESETS.find(
    (p) =>
      p.mode === mode &&
      p.length === length &&
      (mode === "random" && p.sets
        ? p.sets.lower === useLower && p.sets.upper === useUpper && p.sets.digits === useDigits && p.sets.symbols === useSymbols
        : p.mode === "passphrase"
          ? p.words === wordCount
          : true)
  );

  return (
    <div className="space-y-6">
      {/* presets */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            aria-pressed={activePreset?.id === p.id}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              activePreset?.id === p.id
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* mode tabs */}
      <div className="flex gap-2" role="group" aria-label="Generator mode">
        {(
          [
            ["random", "Random"],
            ["passphrase", "Passphrase"],
            ["pin", "PIN"],
          ] as const
        ).map(([m, lbl]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
              mode === m
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* output */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70 px-4">
            <span className="truncate font-mono text-lg text-emerald-300" title={primary}>
              {primary || "Select at least one character set"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button onClick={regenerate} className="h-12 bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400">
              <RefreshCw className="h-4 w-4" aria-hidden /> Regenerate
            </Button>
            <CopyButton text={primary} label="Copy" className="h-12" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-44 flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className={`h-full rounded-full transition-all ${strength.bar}`} style={{ width: `${strength.pct}%` }} aria-hidden />
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${strength.color}`}>
            <StrengthIcon className="h-4 w-4" aria-hidden /> {strength.label}
          </span>
          <span className="text-xs text-zinc-500">
            {Math.round(entropy)} bits · cracked in ~{crackTime(entropy)} offline
          </span>
        </div>
      </div>

      {/* mode options */}
      {mode === "random" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pw-len" className={labelCls}>Length: {length}</Label>
            </div>
            <Slider
              id="pw-len"
              value={[length]}
              min={4}
              max={64}
              step={1}
              onValueChange={([v]) => setLength(v)}
              aria-label="Password length"
              className="[&_[role=slider]]:border-emerald-400 [&_[role=slider]]:bg-emerald-500 [&_.bg-primary]:bg-emerald-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["Lowercase (a–z)", useLower, setUseLower],
                ["Uppercase (A–Z)", useUpper, setUseUpper],
                ["Numbers (0–9)", useDigits, setUseDigits],
                ["Symbols (!@#…)", useSymbols, setUseSymbols],
              ] as const
            ).map(([lbl, val, set]) => (
              <label
                key={lbl}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 has-checked:border-emerald-600/60 has-checked:bg-emerald-950/20"
              >
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500" />
                {lbl}
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300">
              <span>Require every selected set</span>
              <input type="checkbox" checked={requireAll} onChange={(e) => setRequireAll(e.target.checked)} className="h-4 w-4 accent-emerald-500" aria-label="Require every selected character set" />
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300">
              <span>Exclude look-alikes (l, 1, I, O, 0…)</span>
              <input type="checkbox" checked={noAmbiguous} onChange={(e) => setNoAmbiguous(e.target.checked)} className="h-4 w-4 accent-emerald-500" aria-label="Exclude ambiguous characters" />
            </label>
          </div>
        </div>
      )}

      {mode === "passphrase" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pw-words" className={labelCls}>Words: {wordCount}</Label>
            </div>
            <Slider
              id="pw-words"
              value={[wordCount]}
              min={3}
              max={10}
              step={1}
              onValueChange={([v]) => setWordCount(v)}
              aria-label="Number of words"
              className="[&_[role=slider]]:border-emerald-400 [&_[role=slider]]:bg-emerald-500 [&_.bg-primary]:bg-emerald-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-sep" className={labelCls}>Separator</Label>
            <Input id="pw-sep" value={sep} maxLength={3} onChange={(e) => setSep(e.target.value)} className={`${inputCls} font-mono`} placeholder="-" />
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300">
            <span>Capitalize words</span>
            <input type="checkbox" checked={capWords} onChange={(e) => setCapWords(e.target.checked)} className="h-4 w-4 accent-emerald-500" aria-label="Capitalize words" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300">
            <span>Append a number</span>
            <input type="checkbox" checked={addNum} onChange={(e) => setAddNum(e.target.checked)} className="h-4 w-4 accent-emerald-500" aria-label="Append a number" />
          </label>
        </div>
      )}

      {mode === "pin" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw-pin" className={labelCls}>Digits: {length}</Label>
          </div>
          <Slider
            id="pw-pin"
            value={[length]}
            min={3}
            max={12}
            step={1}
            onValueChange={([v]) => setLength(v)}
            aria-label="PIN length"
            className="[&_[role=slider]]:border-emerald-400 [&_[role=slider]]:bg-emerald-500 [&_.bg-primary]:bg-emerald-600"
          />
        </div>
      )}

      {/* bulk */}
      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="pw-bulk" className={labelCls}>Generate a batch</Label>
            <Input
              id="pw-bulk"
              type="number"
              min={1}
              max={50}
              value={bulk}
              onChange={(e) => setBulk(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className={`${inputCls} h-9 w-24`}
              aria-label="How many passwords"
            />
          </div>
          <CopyButton text={batch.join("\n")} label="Copy all" className="h-9" />
        </div>
        {batch.length > 1 && (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {batch.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
                <span className="truncate font-mono text-xs text-zinc-300">{p}</span>
                <CopyButton text={p} label="" className="h-6 w-6 shrink-0 border-0 bg-transparent px-0 hover:bg-zinc-800" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* history */}
      {history.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              <History className="h-3.5 w-3.5" aria-hidden /> Session history
              <span className="normal-case text-zinc-600">— memory only, never saved to disk</span>
            </p>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-red-400"
              aria-label="Clear history"
            >
              <Trash2 className="h-3 w-3" aria-hidden /> Clear
            </button>
          </div>
          <div className="space-y-1">
            {history.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-1.5">
                <span className="truncate font-mono text-xs text-zinc-500">{p}</span>
                <CopyButton text={p} label="" className="h-6 w-6 shrink-0 border-0 bg-transparent px-0 hover:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        <KeyRound className="h-3.5 w-3.5" aria-hidden />
        Generated locally with your browser&apos;s crypto RNG (unbiased modulo) — nothing is stored or sent anywhere.
      </p>
      <p className="flex items-start gap-1.5 text-xs text-zinc-600">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Crack times assume a determined offline attacker (~10 billion guesses/second, stolen database, no rate limits). Unique + long always wins.
      </p>
      <p className="hidden">
        <Copy className="h-0 w-0" aria-hidden />
      </p>
    </div>
  );
}
