import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth";
import { avatarSvg, coverSvg } from "@/lib/covers";
import { one, run, transaction, uploadsDir } from "@/lib/db";
import { paletteHex } from "@/lib/palette";
import { ensureDefaultSettings, setSetting } from "@/lib/settings";
import { id, normalizeArabic, nowIso, slugify } from "@/lib/utils";

type DemoStory = {
  slug: string;
  title: string;
  short: string;
  full: string;
  author: string;
  categories: string[];
  tags: string[];
  age: string;
  type: string;
  genre: string;
  minutes: number;
  featured?: boolean;
  pick?: boolean;
  popularity: number;
  views: number;
  favorites: number;
  order: number;
  date: string;
  series?: string;
  episode?: string;
  related?: string[];
  motif: number;
  color: string;
};

const categories = [
  ["قصص للأطفال", "kids", "حكايات قصيرة وواضحة للصغار، بجمل هادئة وصور قريبة.", "blush", "star", 1, 1, 1],
  ["قصص قصيرة", "short", "نصوص مختصرة تُقرأ في جلسة واحدة.", "cream", "feather", 1, 1, 0],
  ["روايات", "novels", "بدايات روايات وفصول يمكن متابعتها بهدوء.", "mist", "book", 1, 1, 1],
  ["قصص قبل النوم", "bedtime", "قصص ليلية منخفضة الإيقاع، مناسبة لنهاية اليوم.", "lavender", "moon", 1, 1, 1],
  ["قصص تعليمية", "learning", "أفكار صغيرة عن اللغة والانتباه، من غير وعظ ثقيل.", "sage", "lamp", 1, 1, 0],
  ["قصص خيالية", "fantasy", "عوالم لطيفة فيها شيء غير مألوف، من غير صخب.", "dust", "spark", 1, 1, 0],
  ["مغامرات", "adventure", "طرق وخرائط وأبواب، بخطوات يمكن تتبعها.", "sand", "compass", 1, 1, 1],
  ["قصص عائلية", "family", "بيوت وطاولات وأحاديث يومية فيها دفء.", "stone", "home", 1, 0, 0],
  ["قصص مشوقة", "suspense", "حبكات هادئة تُبقي السؤال مفتوحًا حتى السطر الأخير.", "mist", "path", 1, 0, 0],
] as const;

const authors = [
  ["ليلى الحسن", "layla", "تكتب للصغار بلغة قريبة، وتهتم بالقصص التي تُقرأ بصوت منخفض آخر الليل.", "blush"],
  ["يوسف العمري", "yousef", "يبني مغامراته حول الأمكنة: مفتاح، خريطة، وباب لا يُفتح من المحاولة الأولى.", "sand"],
  ["مها السعد", "maha", "قصصها القصيرة تمشي بهدوء ثم تترك سؤالًا صغيرًا في آخر الصفحة.", "mist"],
  ["كريم نجار", "kareem", "يحول الأفكار اليومية إلى حكايات يمكن للطفل أن يعيد روايتها.", "sage"],
  ["هدى فاضل", "huda", "نثرها الروائي بطيء ومكانه غالبًا قطار أو ضفة أو غرفة قراءة.", "cream"],
  ["سامي درويش", "sami", "يكتب عن البيوت والجمعة والورق، وعن الأشياء التي تتكرر فتصير حنانًا.", "stone"],
] as const;

const stories: DemoStory[] = [
  {
    slug: "reesha",
    title: "الريشة الصغيرة",
    short: "ريشة تجد طريقها إلى دفتر طفل، وتعلمه أن الحكاية تبدأ بخط واحد هادئ.",
    full: "وجد سامي ريشة رمادية على حافة النافذة. لم تكن كبيرة، لكنها كانت كافية ليخط أول قوس في دفتره الأبيض.\n\nفي المساء سأل أمه: هل كل قصة كانت يومًا خطًا صغيرًا؟ ابتسمت وقالت: كل قصة كانت يومًا شيئًا خفيفًا انتظر من يلتقطه. نام والريشة تحت وسادته، والدفتر ما زال فيه مكان لجملة ثانية.",
    author: "layla",
    categories: ["kids", "bedtime", "fantasy"],
    tags: ["هدوء", "قراءة", "خيال"],
    age: "٣–٥",
    type: "قصة قبل النوم",
    genre: "خيال",
    minutes: 6,
    featured: true,
    pick: true,
    popularity: 36,
    views: 0,
    favorites: 0,
    order: 1,
    date: "2026-08-02T18:00:00.000Z",
    related: ["najma", "sunduq"],
    motif: 3,
    color: "blush",
  },
  {
    slug: "qamar",
    title: "قمر على النافذة",
    short: "طفل يظن أن القمر ضاع، فيبحث عنه بطريقة أهدأ من أن توقظ البيت.",
    full: "قال ليما إن القمر لم يأتِ الليلة. أزاحت الستارة قليلًا، فرأت غيمة واسعة تجلس مكانه كبطانية.\n\nجلست مع أخيها يعدّان النوافذ في العمارة المقابلة. في كل نافذة ضوء مختلف. حين انزاحت الغيمة، عاد القمر كأنه لم يغب، وقال أخوها: كان يستريح. أغلقا الستارة وناما والنور الفضي ما زال على طرف المخدة.",
    author: "layla",
    categories: ["bedtime", "kids", "family"],
    tags: ["ليل", "هدوء", "عائلة"],
    age: "٦–٨",
    type: "قصة قبل النوم",
    genre: "عائلي",
    minutes: 8,
    popularity: 42,
    views: 0,
    favorites: 0,
    order: 4,
    date: "2026-08-14T18:00:00.000Z",
    related: ["sual"],
    motif: 0,
    color: "lavender",
  },
  {
    slug: "miftah",
    title: "مفتاح المدينة القديمة",
    short: "مفتاح نحاسي لا يفتح بابًا، لكنه يدل على زقاق لم يعد ظاهرًا في الخريطة.",
    full: "اشترى يوسف مفتاحًا من دكان صغير لأن البائع قال: هذا لا يفتح الأبواب، بل يذكّرها. على رأس المفتاح نقش يشبه قوسًا.\n\nفي اليوم التالي مشى مع أخته حتى آخر السوق. هناك كان القوس نفسه مرسومًا على جدار منخفض. لم يدخلا فورًا. كتبا مكان الجدار في دفتر، واتفقا أن المدينة القديمة لا تُستعجل. الجزء الأول من الطريق كان مجرد أن يعرفا أين يقفان.",
    author: "yousef",
    categories: ["adventure", "fantasy"],
    tags: ["مغامرة", "سفر", "لغز"],
    age: "٩–١٢",
    type: "مغامرة",
    genre: "مغامرة",
    minutes: 14,
    featured: true,
    popularity: 28,
    views: 0,
    favorites: 0,
    order: 2,
    date: "2026-07-20T18:00:00.000Z",
    series: "أبواب",
    episode: "١",
    related: ["bawaba"],
    motif: 5,
    color: "sand",
  },
  {
    slug: "risala",
    title: "رسالة لم تصل",
    short: "رسالة تبقى في جيب معطف، وصاحبها يؤجل قراءتها إلى أن يصبح السؤال أعلى من التأجيل.",
    full: "بقيت الرسالة ثلاثة أيام في جيب معطف مها. كانت تعرف الخط، ولا تعرف إن كانت تريد الخبر الآن.\n\nفي اليوم الرابع جلست في مكتبة هادئة وفتحتها. لم يكن في الورقة سرًا كبيرًا، بل موعدًا فاتها وعبارة اعتذار قصيرة. أغلقت الورقة وكتبت ردًا من سطرين. أحيانًا تصل الرسالة متأخرة، ويبقى للرد متسع.",
    author: "maha",
    categories: ["short", "suspense"],
    tags: ["لغز", "قراءة"],
    age: "١٣+",
    type: "قصة قصيرة",
    genre: "تشويق",
    minutes: 11,
    popularity: 18,
    views: 0,
    favorites: 0,
    order: 8,
    date: "2026-08-28T18:00:00.000Z",
    related: ["daw"],
    motif: 2,
    color: "mist",
  },
  {
    slug: "hadeeqa",
    title: "حديقة الأسماء",
    short: "تمرين لطيف: كل نبتة في الحديقة تحمل اسم شعور، والطفل يختار أين يقف اليوم.",
    full: "في باحة المدرسة علب خشبية صغيرة، وعلى كل علبة كلمة: صبر، فرح، خوف، فضول. قالت المعلمة: هذه ليست امتحانًا، بل حديقة.\n\nوقف كريم أمام «فضول» لأنه أراد أن يسأل لماذا ورقة التين أكبر من ورقة النعناع. في آخر الحصة كتب سؤاله وعلّقه بخيط. الحديقة لم تُجِب، لكنها جعلت للسؤال مكانًا ظاهرًا.",
    author: "kareem",
    categories: ["learning", "kids"],
    tags: ["مدرسة", "أسئلة"],
    age: "٦–٨",
    type: "قصة تعليمية",
    genre: "تعليمي",
    minutes: 7,
    popularity: 14,
    views: 0,
    favorites: 0,
    order: 10,
    date: "2026-09-02T18:00:00.000Z",
    related: ["dars"],
    motif: 4,
    color: "sage",
  },
  {
    slug: "zill",
    title: "ظل القطار",
    short: "فصل هادئ عن امرأة تراقب المحطات ولا تنزل إلا حين يشبه اسم المدينة جملة قديمة.",
    full: "لم تكن هدى مستعجلة. القطار يمر بأسماء تعرفها ولا تدخلها. على الطاولة كتاب ناقص، وفي النافذة ظلها يسبق الحقول بثانية.\n\nعند المحطة السابعة رأت مكتبة ما زالت مفتوحة. نزلت لأنها تذكرت أن أمها كانت تقول: المدينة التي فيها مكتبة متأخرة مدينة يمكن النوم فيها. اشترت دفترًا ولم تشترِ تذكرة عودة بعد.",
    author: "huda",
    categories: ["novels", "short"],
    tags: ["سفر", "قراءة", "هدوء"],
    age: "للكبار",
    type: "رواية",
    genre: "أدب هادئ",
    minutes: 18,
    pick: true,
    popularity: 22,
    views: 0,
    favorites: 0,
    order: 3,
    date: "2026-08-08T18:00:00.000Z",
    series: "محطات",
    episode: "١",
    related: ["diffah"],
    motif: 1,
    color: "cream",
  },
  {
    slug: "bait",
    title: "بيت من ورق",
    short: "إخوة يصنعون بيتًا من الصحف القديمة، ثم يكتشفون أن الأخبار القديمة تصلح جدرانًا لا سقوفًا.",
    full: "فرشوا صحف الجمعة على أرض الغرفة. قال كبيرهم: اليوم نبني بيتًا لا يحتاج مسمارًا. ثبتوا الزوايا بالدبابيس، وتركوا نافذة بحجم كف.\n\nحين مرّ الهواء، تحركت الجدران كأنها تقرأ نفسها. ضحكت أمهم وقالت: بيتكم صادق، لأنه لا يدّعي أنه ثابت. ناموا خارجه، وتركوا المصباح صغيرًا داخل النافذة الورقية.",
    author: "sami",
    categories: ["family", "kids"],
    tags: ["عائلة", "دفء"],
    age: "٩–١٢",
    type: "قصة قصيرة",
    genre: "عائلي",
    minutes: 10,
    popularity: 16,
    views: 0,
    favorites: 0,
    order: 9,
    date: "2026-09-06T18:00:00.000Z",
    related: ["asha"],
    motif: 2,
    color: "stone",
  },
  {
    slug: "najma",
    title: "النجمة التي نسيت اسمها",
    short: "نجمة صغيرة تنزل إلى سطح البيت تسأل الأطفال إن كانوا يعرفون ماذا تُسمّى.",
    full: "طقطقت نجمة على حبل الغسيل. قالت بصوت مثل طرف ملعقة: نسيت اسمي في الطريق. لم تخف ليما، لأنها كانت نجمة مهذبة.\n\nاقترحوا أسماء: لمعة، ضيفة، حبة ضوء. النجومة رفضت الأسماء الكبيرة. في آخر الليل اختارت «ها أنا». صعدت قبل الفجر وتركت على الحبل نقطة دافئة، كأنها وعدت أن تعود إن نسوها مرة أخرى.",
    author: "layla",
    categories: ["fantasy", "kids", "bedtime"],
    tags: ["خيال", "ليل", "صداقة"],
    age: "٣–٥",
    type: "قصة خيالية",
    genre: "خيال",
    minutes: 5,
    popularity: 20,
    views: 0,
    favorites: 0,
    order: 6,
    date: "2026-08-21T18:00:00.000Z",
    related: ["reesha", "sunduq"],
    motif: 0,
    color: "dust",
  },
  {
    slug: "bawaba",
    title: "بوابة الخرائط",
    short: "بعد المفتاح، يجد يوسف جدارًا يتحول إلى خريطة إذا وُضع عليه دفتر مبلل قليلًا بالمطر.",
    full: "عاد يوسف إلى القوس ومعه دفتر. كان المطر خفيفًا، وحين لمس الورق الجدار ظهرت خطوط لم تكن في خرائط السوق.\n\nالخطوط لا تقول: ادخل. تقول: انعطف ثم قف. مشى مع أخته خطوتين وتوقفا عند باب أخضر مغلق. لم يفتحاه. رسماه، وكتبا تحته: نعود حين نعرف السؤال الصحيح. هكذا تكبر المغامرة: بسؤال أوضح، لا بمفتاح أكبر.",
    author: "yousef",
    categories: ["adventure", "fantasy"],
    tags: ["مغامرة", "لغز", "سفر"],
    age: "٩–١٢",
    type: "مغامرة",
    genre: "مغامرة",
    minutes: 16,
    popularity: 33,
    views: 0,
    favorites: 0,
    order: 5,
    date: "2026-09-09T18:00:00.000Z",
    series: "أبواب",
    episode: "٢",
    related: ["miftah"],
    motif: 5,
    color: "sand",
  },
  {
    slug: "sual",
    title: "سؤال قبل النوم",
    short: "سؤال واحد فقط قبل إطفاء الضوء، والأم تجيب بجملة لا تغلق الباب على الخيال.",
    full: "اتفقا على قاعدة: سؤال واحد بعد قصة الليل. سألت الطفلة: أين تذهب الكلمات التي لا نقولها؟\n\nفكرت أمها ثم قالت: تجلس في الجيب الهادئ، حتى يأتي يوم تحتاجينها فيه فتكون جاهزة. أطفأت الطفلة الضوء وهي تعد الجيوب التي تعرفها. لم تحتج إلى سؤال ثانٍ.",
    author: "maha",
    categories: ["bedtime", "family"],
    tags: ["ليل", "أسئلة", "دفء"],
    age: "٦–٨",
    type: "قصة قبل النوم",
    genre: "عائلي",
    minutes: 4,
    popularity: 12,
    views: 0,
    favorites: 0,
    order: 11,
    date: "2026-09-18T18:00:00.000Z",
    related: ["qamar"],
    motif: 1,
    color: "lavender",
  },
  {
    slug: "dars",
    title: "الدرس الذي صار لعبة",
    short: "حصة عن الانتباه تتحول إلى لعبة البحث عن شيء واحد جميل في الغرفة.",
    full: "قال المعلم: اليوم لا نحفظ قائمة. نختار شيئًا واحدًا ونصفه بثلاث جمل صادقة. اختار أحدهم ممحاة، وآخر ظل الكرسي، وثالث نافذة عليها غبار ناعم.\n\nحين قرأ كريم جمله، اكتشف أنه يرى الغرفة أول مرة رغم أنه يجلس فيها كل يوم. انتهى الدرس من غير جرس عالٍ. بقيت الممحاة على الطاولة كأنها بطلة صغيرة.",
    author: "kareem",
    categories: ["learning", "kids"],
    tags: ["مدرسة", "هدوء"],
    age: "٦–٨",
    type: "قصة تعليمية",
    genre: "تعليمي",
    minutes: 9,
    popularity: 11,
    views: 0,
    favorites: 0,
    order: 12,
    date: "2026-09-12T18:00:00.000Z",
    related: ["hadeeqa"],
    motif: 4,
    color: "sage",
  },
  {
    slug: "diffah",
    title: "ضفة أخرى",
    short: "امرأة تعبر جسرًا قصيرًا كل مساء، وتؤجل القرار إلى أن تصير الضفة مألوفة.",
    full: "الجسر لا يأخذ أكثر من دقيقتين. مع ذلك كانت هدى تقف في وسطه وتنظر إلى الماء كأنه هامش صفحة.\n\nفي الضفة الأخرى مقهى قليل الضوء ورف كتب مستعملة. لم تشترِ شيئًا في الأسبوع الأول. في الأسبوع الثاني أخذت رواية ناقصة الغلاف لأنها أحبت أن تبدأ من المنتصف. بعض البدايات لا تحتاج بابًا جديدًا، بل ضفة يمكن العودة منها.",
    author: "huda",
    categories: ["novels", "short"],
    tags: ["قراءة", "هدوء"],
    age: "للكبار",
    type: "رواية",
    genre: "أدب هادئ",
    minutes: 12,
    featured: true,
    popularity: 15,
    views: 0,
    favorites: 0,
    order: 7,
    date: "2026-08-30T18:00:00.000Z",
    related: ["zill"],
    motif: 1,
    color: "cream",
  },
  {
    slug: "asha",
    title: "عشاء يوم الجمعة",
    short: "طاولة تتسع لشخص إضافي، والسؤال الوحيد: من يحضر الخبز هذه المرة.",
    full: "في بيت سامي، الجمعة ليست حفلة. هي كرسي يُسحب بهدوء وملعقة إضافية. هذه المرة تأخر الخبز، فجلسوا يتحدثون عن الطريق لا عن الجوع.\n\nحين وصل الخبز كان دافئًا بما يكفي ليغفر التأخير. قالت الجدة: العشاء ينجح إذا وصل الناس قبل الطعام. ضحكوا، وقسموا الرغيف من غير أن يحسب أحد الأنصبة.",
    author: "sami",
    categories: ["family", "short"],
    tags: ["عائلة", "دفء"],
    age: "١٣+",
    type: "قصة قصيرة",
    genre: "عائلي",
    minutes: 9,
    popularity: 13,
    views: 0,
    favorites: 0,
    order: 13,
    date: "2026-09-20T18:00:00.000Z",
    related: ["bait"],
    motif: 2,
    color: "stone",
  },
  {
    slug: "sunduq",
    title: "صندوق الأزرار",
    short: "صندوق فيه أزرار لا قمصان، وكل زر يفتح حكاية قصيرة قبل النوم.",
    full: "أعطت الجدة حفيدتها صندوقًا خشبيًا. في داخله أزرار: أحمر، صدفي، وزر بلا عين. قالت: اختاري واحدًا وسأحكي ما يشبهه.\n\nاختارت الزر الصدفي. حكت الجدة عن بحر صغير رأته مرة من شباك القطار، لا من الشاطئ. نامت الطفلة والزر في يدها، والصندوق بقي مغلقًا على حكايات لا تحتاج أن تُروى كلها في ليلة واحدة.",
    author: "layla",
    categories: ["kids", "bedtime", "family"],
    tags: ["عائلة", "خيال", "ليل"],
    age: "٣–٥",
    type: "قصة قبل النوم",
    genre: "خيال",
    minutes: 6,
    popularity: 9,
    views: 0,
    favorites: 0,
    order: 14,
    date: "2026-09-26T18:00:00.000Z",
    related: ["reesha", "najma"],
    motif: 3,
    color: "blush",
  },
  {
    slug: "daw",
    title: "الضوء الأخير في المكتبة",
    short: "مصباح يبقى مضاءً بعد الإغلاق، ووراءه دفتر استعارة ينقصه اسم.",
    full: "بعد إغلاق المكتبة بقي مصباح واحد في القاعة الخلفية. عادت مها لأنها نسيت وشاحها، فوجدت الدفتر مفتوحًا على سطر بلا اسم.\n\nلم يكن هناك أحد. كان هناك كتاب أُعيد إلى الرف الخطأ، وورقة تقول: سأكمله غدًا. أغلقت مها الدفتر وتركت الوشاح مكانه عمدًا، كعلامة صغيرة أنها ستعود لتسأل من يقرأ في الضوء الأخير.",
    author: "maha",
    categories: ["suspense", "short"],
    tags: ["لغز", "قراءة", "ليل"],
    age: "١٣+",
    type: "قصة قصيرة",
    genre: "تشويق",
    minutes: 15,
    pick: true,
    featured: true,
    popularity: 19,
    views: 0,
    favorites: 0,
    order: 2,
    date: "2026-09-24T18:00:00.000Z",
    related: ["risala"],
    motif: 2,
    color: "mist",
  },
];

function writeMedia(filename: string, svg: string, alt: string, width: number, height: number) {
  fs.writeFileSync(path.join(uploadsDir(), filename), svg);
  const mediaId = id();
  run(
    `INSERT INTO media (id, filename, original_name, mime, size, width, height, alt, is_demo, created_at)
     VALUES (?, ?, ?, 'image/svg+xml', ?, ?, ?, ?, 1, ?)`,
    mediaId,
    filename,
    filename,
    Buffer.byteLength(svg),
    width,
    height,
    alt,
    nowIso(),
  );
  return mediaId;
}

function ensureTag(name: string) {
  const slug = slugify(name);
  const existing = one<{ id: string }>("SELECT id FROM tags WHERE slug = ?", slug);
  if (existing) return existing.id;
  const tagId = id();
  run("INSERT INTO tags (id, name, slug, name_norm) VALUES (?, ?, ?, ?)", tagId, name, slug, normalizeArabic(name));
  return tagId;
}

function ensureAdmin() {
  if (one("SELECT id FROM users WHERE role = 'admin'")) return;
  const email = (process.env.ADMIN_EMAIL || "admin@yara.com").toLowerCase();
  let password = process.env.ADMIN_PASSWORD || "yara3admin12";
  if (!password) {
    password = randomBytes(9).toString("base64url");
    fs.writeFileSync(path.join(process.cwd(), "data", "admin-credentials.txt"), `email: ${email}\npassword: ${password}\n`, { flag: "wx" });
  }
  run(
    "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'admin', ?)",
    id(),
    "إدارة يراع",
    email,
    hashPassword(password),
    nowIso(),
  );
}

export function seedIfNeeded() {
  ensureDefaultSettings();
  ensureAdmin();
  const seeded = one<{ value: string }>("SELECT value FROM settings WHERE key = 'seeded'");
  if (seeded?.value === "1") return;

  const stamp = nowIso();
  const categoryIds = new Map<string, string>();
  const authorIds = new Map<string, string>();
  const storyIds = new Map<string, string>();

  transaction(() => {
    categories.forEach((category, index) => {
      const [name, slug, description, color, icon, home, nav, featured] = category;
      const categoryId = id();
      categoryIds.set(slug, categoryId);
      run(
        `INSERT INTO categories (
          id, name, slug, name_norm, description, image_id, icon, color, sort_order, published, show_on_home, show_in_nav, featured, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 1, ?, ?, ?, 1, ?, ?)`,
        categoryId,
        name,
        slug,
        normalizeArabic(name),
        description,
        icon,
        color,
        index + 1,
        home,
        nav,
        featured,
        stamp,
        stamp,
      );
    });

    authors.forEach((author) => {
      const [name, slug, bio, color] = author;
      const authorId = id();
      authorIds.set(slug, authorId);
      const imageId = writeMedia(`${authorId}.svg`, avatarSvg(paletteHex(color)), name, 600, 600);
      run(
        `INSERT INTO authors (id, name, slug, name_norm, bio, image_id, featured, is_demo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        authorId,
        name,
        slug,
        normalizeArabic(name),
        bio,
        imageId,
        slug === "layla" || slug === "huda" ? 1 : 0,
        stamp,
        stamp,
      );
    });

    for (const story of stories) {
      const storyId = id();
      storyIds.set(story.slug, storyId);
      const coverId = writeMedia(`${storyId}.svg`, coverSvg(paletteHex(story.color), story.motif), story.title, 800, 1100);
      run(
        `INSERT INTO stories (
          id, title, slug, title_norm, short_description, short_norm, full_description, author_id, cover_id, primary_category_id,
          age_range, story_type, genre, genre_norm, reading_minutes, featured, editor_pick, published, publish_at, popularity,
          view_count, favorite_count, admin_notes, display_order, narrator, series_name, episode_number, external_source,
          audio_url, video_url, is_demo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, '', ?, '', ?, ?, '', '', '', 1, ?, ?)`,
        storyId,
        story.title,
        story.slug,
        normalizeArabic(story.title),
        story.short,
        normalizeArabic(story.short),
        story.full,
        authorIds.get(story.author) ?? null,
        coverId,
        categoryIds.get(story.categories[0]) ?? null,
        story.age,
        story.type,
        story.genre,
        normalizeArabic(story.genre),
        story.minutes,
        story.featured ? 1 : 0,
        story.pick ? 1 : 0,
        story.date,
        story.popularity,
        story.views,
        story.favorites,
        story.order,
        story.series ?? "",
        story.episode ?? "",
        story.date,
        stamp,
      );
      for (const category of story.categories) {
        const categoryId = categoryIds.get(category);
        if (categoryId) run("INSERT INTO story_categories (story_id, category_id) VALUES (?, ?)", storyId, categoryId);
      }
      for (const tag of story.tags) {
        run("INSERT INTO story_tags (story_id, tag_id) VALUES (?, ?)", storyId, ensureTag(tag));
      }
    }

    for (const story of stories) {
      const storyId = storyIds.get(story.slug);
      if (!storyId || !story.related) continue;
      for (const related of story.related) {
        const relatedId = storyIds.get(related);
        if (relatedId) run("INSERT OR IGNORE INTO story_relations (story_id, related_id) VALUES (?, ?)", storyId, relatedId);
      }
    }

    const sections: Array<[string, string, string, string, number, string, string]> = [
      ["hero", "اكتشف قصتك القادمة", "يراع مكان هادئ للبحث عن قصة تناسب وقتك.", "editorial", 4, "auto", JSON.stringify({
        kicker: "قصص وروايات",
        heading: "اكتشف قصتك القادمة",
        lede: "يراع مكان مريح للقصص والروايات. تصنيفات واضحة، بحث سهل، واقتراحات تُرتَّب حسب ما يشبه ذوقك.",
        placeholder: "ابحث عن قصة أو مؤلف أو تصنيف",
        buttonLabel: "استكشف القصص",
        buttonHref: "/explore",
      })],
      ["categories", "استكشف التصنيفات", "اختر المزاج أولًا، ثم القصة.", "grid", 9, "auto", "{}"],
      ["recommended", "مقترحة لك", "تُرتَّب حسب التصنيف والوسوم والرواج، وتتقارب مع ما قرأته حين يتوفر.", "grid", 4, "auto", "{}"],
      ["popular", "الأكثر رواجًا", "القصص التي يعود إليها القرّاء أكثر.", "carousel", 8, "auto", "{}"],
      ["recent", "وصل حديثًا", "إضافات الأيام الأخيرة.", "carousel", 8, "auto", "{}"],
      ["picks", "اختيارات يراع", "قصص نضعها في المقدمة بهدوء.", "editorial", 4, "auto", "{}"],
      ["featured", "قصص مميزة", "أعمال ظاهرة على الصفحة لأهميتها الآن.", "grid", 4, "auto", "{}"],
      ["authors", "أصوات تروي", "مؤلفون يمكن متابعة قصصهم.", "grid", 4, "auto", "{}"],
    ];

    sections.forEach((section, index) => {
      const [type, title, subtitle, layout, count, mode, config] = section;
      run(
        `INSERT INTO homepage_sections (id, type, title, subtitle, enabled, sort_order, mode, item_count, layout, config, starts_at, ends_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NULL, NULL)`,
        id(),
        type,
        title,
        subtitle,
        index + 1,
        mode,
        count,
        layout,
        config,
      );
    });

    setSetting("seeded", "1");
  });
}
