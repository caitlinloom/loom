// ─── 100 Compatibility Questions ─────────────────────────────────────────────
// Exact port from prototype. Do not alter ids, weights, options, or conditionals.

export type QType = 'choice' | 'scale';

export interface Question {
  id:   number;
  cat:  string;
  q:    string;
  type: QType;
  opts?: string[];   // for choice questions
  min?: string;      // for scale questions
  max?: string;      // for scale questions
  w:    1 | 2 | 3;  // compatibility weight
  cond?: {           // conditional: only show if answers[q.cond.q] is in cond.a
    q: number;
    a: number[];
  };
}

export const QS: Question[] = [
  {id:1,  cat:"Values",q:"Do you want children?",type:"choice",opts:["Yes","Probably yes","Open to it","Probably not","No"],w:3},
  {id:2,  cat:"Values",q:"How important is marriage or long-term legal commitment?",type:"choice",opts:["Essential","Important","Somewhat","Not very","Not at all"],w:3},
  {id:3,  cat:"Values",q:"How central is religion or spirituality to your daily life?",type:"scale",min:"Secular",max:"Deeply spiritual",w:3},
  {id:4,  cat:"Values",q:"Where do you see yourself living in five years?",type:"choice",opts:["Same city","New city, same country","Another country","Wherever life leads","Somewhere rural"],w:2},
  {id:5,  cat:"Values",q:"How would you describe your political orientation?",type:"choice",opts:["Very progressive","Moderately progressive","Centrist","Moderately conservative","Very conservative"],w:2},
  {id:6,  cat:"Values",q:"How important is financial stability before committing?",type:"scale",min:"Not at all",max:"Non-negotiable",w:2},
  {id:7,  cat:"Values",q:"When honesty might hurt, what do you choose?",type:"choice",opts:["Always the truth","Honesty with tact","It depends","Spare feelings","A kind omission is fine"],w:2},
  {id:8,  cat:"Values",q:"How important is shared cultural background in a partner?",type:"scale",min:"Not at all",max:"Very important",w:1},
  {id:9,  cat:"Values",q:"Your stance on monogamy?",type:"choice",opts:["Strictly monogamous","Monogamous, but open-minded","Open to ethical non-monogamy","Prefer open relationships","Polyamorous"],w:3},
  {id:10, cat:"Values",q:"How do you feel about your partner maintaining close friendships with people they could be attracted to?",type:"choice",opts:["Completely fine","Fine with boundaries","Slightly uncomfortable","Prefer they don't","Strongly against"],w:2},
  {id:11, cat:"Values",q:"How do you think about gender roles in a relationship?",type:"choice",opts:["Fully egalitarian","Mostly egalitarian","Flexible","Somewhat traditional","Traditional"],w:2},
  {id:12, cat:"Values",q:"How important is environmental sustainability in how you live?",type:"scale",min:"Not a factor",max:"Central to my life",w:1},
  {id:13, cat:"Values",q:"How important is career ambition in a partner?",type:"scale",min:"Unimportant",max:"Essential",w:1},
  {id:14, cat:"Values",q:"How do you feel about secrets between partners?",type:"choice",opts:["Never acceptable","Rarely okay","Sometimes","Privacy matters","Everyone keeps some"],w:2},
  {id:15, cat:"Values",q:"How much does a sense of shared purpose matter?",type:"scale",min:"Not much",max:"Everything",w:2},
  {id:16, cat:"Communication",q:"When you're upset, what do you need first?",type:"choice",opts:["Talk it out now","A brief pause, then talk","A few hours alone","Sleep on it","Days to process"],w:2},
  {id:17, cat:"Communication",q:"How do you navigate disagreements?",type:"choice",opts:["Head-on discussion","Calm, measured talk","Writing my thoughts first","Avoiding until I must","Bringing in a third party"],w:2},
  {id:18, cat:"Communication",q:"How much verbal affirmation do you need?",type:"scale",min:"Rarely",max:"Constantly",w:1},
  {id:19, cat:"Communication",q:"How comfortable are you with emotional vulnerability?",type:"scale",min:"Very guarded",max:"Fully open",w:2},
  {id:20, cat:"Communication",q:"Ideal daily communication with a partner?",type:"choice",opts:["Constant texting","Regular check-ins","A few messages","Evening calls","Minimal until we're together"],w:1},
  {id:21, cat:"Communication",q:"When your partner criticizes something you've done, you tend to\u2026",type:"choice",opts:["Welcome it","Listen, but feel hurt","Get defensive at first","Shut down","Push back"],w:2},
  {id:22, cat:"Communication",q:"What is your primary love language?",type:"choice",opts:["Words of affirmation","Acts of service","Gifts","Quality time","Physical touch"],w:2},
  {id:23, cat:"Communication",q:"Raised voices during arguments?",type:"choice",opts:["Never acceptable","Very rarely","It happens","Normal expression","Depends entirely"],w:2},
  {id:24, cat:"Communication",q:"How do you feel about comfortable silence together?",type:"scale",min:"Uncomfortable",max:"One of life\u2019s pleasures",w:1},
  {id:25, cat:"Communication",q:"How much do you share about your relationship with others?",type:"choice",opts:["Everything","Most things","General updates","Very little","Almost nothing"],w:1},
  {id:26, cat:"Communication",q:"How essential is humor in your day-to-day?",type:"scale",min:"Nice to have",max:"Absolutely essential",w:1},
  {id:27, cat:"Communication",q:"How do you apologize?",type:"choice",opts:["Immediately and verbally","With actions, not just words","I need time first","I show it through behavior","I struggle with this"],w:2},
  {id:28, cat:"Communication",q:"Discussing past relationships?",type:"choice",opts:["Open book","If asked","Broad strokes only","Prefer not to","The past is the past"],w:1},
  {id:29, cat:"Communication",q:"How important is it that a partner remembers small details?",type:"scale",min:"Not really",max:"Deeply important",w:1},
  {id:30, cat:"Communication",q:"How do you prefer to receive difficult news?",type:"choice",opts:["Direct and immediate","Gently but honestly","In writing first","In person only","With time to prepare"],w:1},
  {id:31, cat:"Lifestyle",q:"Morning person or night owl?",type:"choice",opts:["Up before dawn","Morning person","Flexible","Night owl","Creature of the night"],w:1},
  {id:32, cat:"Lifestyle",q:"How often do you move your body?",type:"choice",opts:["Daily","4\u20135 times a week","2\u20133 times a week","Now and then","Rarely"],w:1},
  {id:33, cat:"Lifestyle",q:"How tidy is your living space?",type:"scale",min:"Lived-in",max:"Immaculate",w:2},
  {id:34, cat:"Lifestyle",q:"Your relationship with tobacco?",type:"choice",opts:["I smoke","Socially","Formerly","Never, prefer a non-smoker","Strong aversion"],w:2},
  {id:35, cat:"Lifestyle",q:"How often do you drink?",type:"choice",opts:["Never","Rarely","Socially","Regularly","Most days"],w:2},
  {id:36, cat:"Lifestyle",q:"How conscious are you about what you eat?",type:"scale",min:"Eat anything",max:"Very health-conscious",w:1},
  {id:37, cat:"Lifestyle",q:"Your ideal weekend?",type:"choice",opts:["Outdoors and active","Social gatherings","A mix","Quiet at home","Creative projects"],w:1},
  {id:38, cat:"Lifestyle",q:"How do you feel about living with pets?",type:"choice",opts:["Love all animals","Dog person","Cat person","Neutral","Prefer none"],w:2},
  {id:39, cat:"Lifestyle",q:"Recreational screen time per day?",type:"choice",opts:["Under an hour","1\u20132 hours","2\u20134 hours","4\u20136 hours","6+"],w:1},
  {id:40, cat:"Lifestyle",q:"Any dietary restrictions?",type:"choice",opts:["None","Vegetarian","Vegan","Religious observance","Allergies or other"],w:1},
  {id:41, cat:"Lifestyle",q:"Cooking at home vs. dining out?",type:"choice",opts:["Almost always cook","Mostly cook","Half and half","Mostly out","Almost always out"],w:1},
  {id:42, cat:"Lifestyle",q:"Your view on cannabis?",type:"choice",opts:["Regular user","Occasional","Open to it","Prefer a partner who doesn\u2019t","Strongly against"],w:2},
  {id:43, cat:"Lifestyle",q:"How much alone time do you need?",type:"scale",min:"Very little",max:"A great deal",w:2},
  {id:44, cat:"Lifestyle",q:"How important is travel to you?",type:"scale",min:"Homebody",max:"Essential",w:1},
  {id:45, cat:"Lifestyle",q:"How do you prefer to spend major holidays?",type:"choice",opts:["With my family","With a partner\u2019s family","Alternating","Just us","Traveling"],w:1},
  {id:46, cat:"Lifestyle",q:"How social are you?",type:"choice",opts:["Extremely","Quite","Moderate","Small gatherings only","Mostly introverted"],w:1},
  {id:47, cat:"Lifestyle",q:"How spontaneous are you?",type:"scale",min:"I plan everything",max:"Entirely spontaneous",w:1},
  {id:48, cat:"Lifestyle",q:"City, suburbs, or countryside?",type:"choice",opts:["City center","City preferred","Suburbs","Small town","Rural"],w:1},
  {id:49, cat:"Lifestyle",q:"How important is a creative or artistic life?",type:"scale",min:"Not at all",max:"Central to who I am",w:1},
  {id:50, cat:"Lifestyle",q:"How do you feel about gaming?",type:"choice",opts:["Avid gamer","Casual","Occasional","Uninterested","Rather not"],w:1},
  {id:51, cat:"Finances",q:"Spender or saver?",type:"scale",min:"Free spender",max:"Aggressive saver",w:2},
  {id:52, cat:"Finances",q:"How should a couple handle money?",type:"choice",opts:["Fully shared","Shared + personal accounts","Split by income ratio","50/50","Completely separate"],w:2},
  {id:53, cat:"Finances",q:"How do you feel about a significant income gap between partners?",type:"choice",opts:["No issue","Fine if discussed","Somewhat uncomfortable","Prefer parity","Must be equal"],w:1},
  {id:54, cat:"Finances",q:"Your comfort with debt?",type:"choice",opts:["Avoid all debt","Mortgage and education only","Reasonable debt is fine","Strategic credit use","Don\u2019t stress about it"],w:2},
  {id:55, cat:"Finances",q:"How important are material comforts?",type:"scale",min:"Minimalist",max:"Love the finer things",w:1},
  {id:56, cat:"Finances",q:"Thoughts on prenuptial agreements?",type:"choice",opts:["Essential","Smart idea","If needed","Unnecessary","Opposed"],w:1},
  {id:57, cat:"Finances",q:"How important is financial transparency with a partner?",type:"scale",min:"Some privacy is fine",max:"Total transparency",w:2},
  {id:58, cat:"Finances",q:"Supporting a partner financially during a rough patch?",type:"choice",opts:["Without question","Within reason","Temporarily","Uncomfortable","Everyone should be self-sufficient"],w:2},
  {id:59, cat:"Finances",q:"Your relationship to charitable giving?",type:"choice",opts:["Give generously","Modest and regular","Occasional","Rare","Not a priority"],w:1},
  {id:60, cat:"Finances",q:"How much should a typical date cost?",type:"choice",opts:["Free or near-free","$20\u201350","$50\u2013100","$100\u2013200","Price is irrelevant"],w:1},
  {id:61, cat:"Intimacy",q:"How important is daily physical affection?",type:"scale",min:"Nice, not necessary",max:"Absolutely essential",w:2},
  {id:62, cat:"Intimacy",q:"How important is sexual compatibility?",type:"scale",min:"Not a priority",max:"Extremely",w:2},
  {id:63, cat:"Intimacy",q:"Public displays of affection?",type:"choice",opts:["Love them","Hand-holding, light PDA","Subtle only","Private affection","Not comfortable"],w:1},
  {id:64, cat:"Intimacy",q:"How important are regular date nights in a long-term relationship?",type:"scale",min:"Not necessary",max:"Non-negotiable",w:1},
  {id:65, cat:"Intimacy",q:"Maintaining romance over years?",type:"choice",opts:["Requires active effort","Important but organic","Ebbs and flows","Comfort matters more","Romance naturally fades"],w:2},
  {id:66, cat:"Intimacy",q:"How comfortable are you initiating intimacy?",type:"scale",min:"Prefer my partner does",max:"Very comfortable",w:1},
  {id:67, cat:"Intimacy",q:"How important is intellectual chemistry?",type:"scale",min:"Not very",max:"As important as anything",w:2},
  {id:68, cat:"Intimacy",q:"Sharing passwords and phone access?",type:"choice",opts:["Always open","If asked","Some things","Privacy is important","Never"],w:1},
  {id:69, cat:"Intimacy",q:"How often do you need quality one-on-one time?",type:"choice",opts:["Daily, extended","Daily check-in","Several times a week","Weekly","Less is fine"],w:1},
  {id:70, cat:"Intimacy",q:"How do you most naturally show love?",type:"choice",opts:["Saying it","Thoughtful gestures","Physical closeness","Spending time","Giving gifts"],w:1},
  {id:71, cat:"Intimacy",q:"How important is physical attraction?",type:"scale",min:"Character matters most",max:"Very important",w:1},
  {id:72, cat:"Intimacy",q:"Flirting with others while in a relationship?",type:"choice",opts:["Harmless","Light flirting is fine","Only with partner present","Uncomfortable","Never"],w:2},
  {id:73, cat:"Family",q:"How involved should extended family be in your relationship?",type:"scale",min:"Minimal",max:"Very involved",w:2},
  {id:74, cat:"Family",q:"How close are you with your own family?",type:"choice",opts:["Extremely","Close","Moderate","Somewhat distant","Estranged"],w:1},
  {id:75, cat:"Family",q:"Handling disagreements with in-laws?",type:"choice",opts:["Direct conversation","Partner mediates","Boundaries together","Avoid conflict","Distance"],w:1},
  {id:76, cat:"Family",q:"A partner who\u2019s very close to their parents?",type:"choice",opts:["Love that","Positive","Neutral","Slightly concerned","Prefer independence"],w:1},
  {id:77, cat:"Family",q:"How essential are friendships outside the relationship?",type:"scale",min:"My partner is enough",max:"Vital to my wellbeing",w:1},
  {id:78, cat:"Family",q:"Your partner traveling without you?",type:"choice",opts:["Encourage it","Happy for them","Okay sometimes","Prefer going together","Uneasy"],w:1},
  {id:79, cat:"Family",q:"Caring for aging parents?",type:"choice",opts:["Move them in","Live nearby","Regular visits","Professional care","Complicated for me"],w:2},
  {id:80, cat:"Family",q:"A partner\u2019s ex remaining in their life?",type:"choice",opts:["Fine","Fine with boundaries","Uncomfortable but tolerant","Prefer no contact","Dealbreaker"],w:1},
  {id:81, cat:"Family",q:"How do you feel about biological vs. adopted children?",type:"choice",opts:["Only biological","Prefer biological","Equally open to both","Prefer adoption","Only adoption"],w:2,cond:{q:1,a:[0,1,2]}},
  {id:82, cat:"Family",q:"Ideal number of children?",type:"choice",opts:["One","Two","Three","Four or more","Whatever feels right"],w:2,cond:{q:1,a:[0,1,2]}},
  {id:83, cat:"Family",q:"How would you approach parenting and discipline?",type:"choice",opts:["Gentle parenting","Gentle with firm boundaries","Balanced","Structured","Traditional"],w:2,cond:{q:1,a:[0,1,2]}},
  {id:84, cat:"Family",q:"Co-parenting if a partner already has children?",type:"choice",opts:["Fully embrace it","Open to it","Cautiously open","Prefer not","Not for me"],w:2},
  {id:85, cat:"Family",q:"How important are family traditions?",type:"scale",min:"Not very",max:"Deeply important",w:1},
  {id:86, cat:"Growth",q:"How do you feel about therapy?",type:"choice",opts:["Currently in it","Strong advocate","Open to it","Last resort","Not for me"],w:2},
  {id:87, cat:"Growth",q:"How driven are you toward self-improvement?",type:"scale",min:"Content as I am",max:"Always evolving",w:1},
  {id:88, cat:"Growth",q:"How do you manage stress?",type:"choice",opts:["Physical activity","Talking it through","Solitude or meditation","Staying busy","Still figuring this out"],w:1},
  {id:89, cat:"Growth",q:"How important is intellectual curiosity in a partner?",type:"scale",min:"Not especially",max:"Profoundly",w:1},
  {id:90, cat:"Growth",q:"How do you feel about personal boundaries?",type:"choice",opts:["Strong individual boundaries","Healthy boundaries","Flexible","Closeness over boundaries","What\u2019s mine is yours"],w:2},
  {id:91, cat:"Growth",q:"How do you handle jealousy?",type:"choice",opts:["Rarely feel it","Name it and communicate","Feel it, manage internally","Prone to it","It\u2019s a real challenge"],w:2},
  {id:92, cat:"Growth",q:"A partner pointing out areas for your growth?",type:"choice",opts:["Always welcome","If constructive","Depends on delivery","Prefer self-discovery","Rather they didn\u2019t"],w:2},
  {id:93, cat:"Growth",q:"Work-life balance?",type:"scale",min:"Career comes first",max:"Life outside work is paramount",w:1},
  {id:94, cat:"Growth",q:"Stepping outside your comfort zone?",type:"scale",min:"Love my routines",max:"Thrive on the unfamiliar",w:1},
  {id:95, cat:"Growth",q:"How open are you to changing deeply held beliefs?",type:"scale",min:"Very set",max:"Always questioning",w:1},
  {id:96, cat:"Dealbreakers",q:"Your biggest dealbreaker?",type:"choice",opts:["Dishonesty","Lack of ambition","Poor communication","Misaligned life goals","No physical spark"],w:3},
  {id:97, cat:"Dealbreakers",q:"Long-distance relationships?",type:"choice",opts:["Can work","Temporarily","Very hard","Rather not","Absolutely not"],w:2},
  {id:98, cat:"Dealbreakers",q:"How essential is being able to laugh together?",type:"scale",min:"Nice, not critical",max:"The most important thing",w:2},
  {id:99, cat:"Dealbreakers",q:"Would you relocate for a partner\u2019s career?",type:"choice",opts:["Absolutely","Probably","I\u2019d consider it","Unlikely","Never"],w:2},
  {id:100,cat:"Dealbreakers",q:"What matters most in a life partner?",type:"choice",opts:["Emotional intelligence","Shared values","Physical chemistry","Intellectual connection","Stability"],w:3},
];

export const CATS = [
  "Values",
  "Communication",
  "Lifestyle",
  "Finances",
  "Intimacy",
  "Family",
  "Growth",
  "Dealbreakers",
] as const;

export type Category = typeof CATS[number];
