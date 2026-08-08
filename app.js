const STORAGE_KEY='tinyCompanionSpellbook.v1';
const FAV_KEY='tinyCompanionSpellbook.favourites';

const sampleCards=[{
  id:'boredom-portal',title:'Boredom Portal',situation:'Miki says she is bored or can’t think of anything to play.',
  tags:['boredom','independent play','low-energy parenting','connection'],
  what_miki_might_say:['I’m bored','I can’t think','Mummy play with me'],
  underneath:'She may need help starting play, connection, or reassurance. Boredom is not an emergency.',
  goal:'Validate boredom without becoming the whole entertainment engine. Scaffold independent play.',
  say_this:['It’s okay to be bored. Bored is when your brain is looking for an idea.','You could play neighbours, supermarket, or doctors with your stuffed animals.','I’m going to sit here and rest while you start. You can show me what happens.'],
  avoid_saying:['Just go play by yourself.','Stop being bored.','I can’t deal with this.'],
  tiny_finesse:'Offer 2–3 options, not 12. Too many choices becomes another boss fight. If she feels disconnected, say you’ll watch from the couch rather than telling her to go away.',
  low_mana_version:'Pick: doctors or supermarket. I’ll watch from the couch.',
  repair_version:'I sounded grumpy before. You didn’t do anything wrong. I’m tired, and I’m going to help you start one game.',
  related_spells:['mummy-play-with-me','youre-making-me-upset'],
  notes:'Example: She said she was bored after breakfast. I normalised boredom, then offered neighbours/supermarket/doctors as play portals.'
},{
  id:'mummy-play-with-me',title:'The Couch Familiar',situation:'Miki repeatedly asks “Mummy, play with me” when energy is low.',
  tags:['connection','play','fatigue','couch games','boundaries'],
  what_miki_might_say:['Mummy play with me','No, you do it','Come on, Mummy'],
  underneath:'She wants connection and may be asking for help crossing the gap into play. Repetition can also be a bid for reassurance.',
  goal:'Offer real connection in a form your body can manage, while keeping the boundary clear.',
  say_this:['I can play from the couch. Bring me three toys and I’ll be the shopkeeper.','I can watch, guess, or be a character who stays right here. You choose.'],
  avoid_saying:['I already said no.','You never play by yourself.'],
  tiny_finesse:'Name the kind of yes you can offer before repeating the no. A constrained yes is easier for a preschool brain to use.',
  low_mana_version:'I can play from here. Bring me three toys.',
  repair_version:'I snapped because my body is tired. You were asking to be close to me. Come sit beside me and we’ll choose a couch game.',
  related_spells:['boredom-portal'],notes:''
},{
  id:'separation-bridge',title:'Separation Bridge',situation:'Drop-off or another goodbye feels too big and Miki says she will miss Mum.',
  tags:['separation anxiety','daycare','goodbye','reassurance'],
  what_miki_might_say:['I’ll miss you','I don’t want school','Stay with me'],
  underneath:'Her words are older than her nervous system. She can understand the plan and still find the separation physically hard.',
  goal:'Be warm, predictable, and brief. Give her a concrete bridge to reunion.',
  say_this:['You will miss me, and your teachers will look after you. I always come back after afternoon tea.','One cuddle, one kiss, then I’m going. You can wave at the window.'],
  avoid_saying:['There’s nothing to be sad about.','If you keep crying, I’ll be late.'],
  tiny_finesse:'Use the same short goodbye ritual. Avoid adding new negotiations after the goodbye has begun.',
  low_mana_version:'You’re safe. I always come back. Cuddle, kiss, wave.',
  repair_version:'Goodbyes were hard this morning. I’m sorry I rushed. I came back, just like I promised.',
  related_spells:[],notes:''
}];

let cards=loadCards();
let favourites=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]'));
let activeCard=null;
let state={query:'',lowMana:false,favouritesOnly:false};
let addMethod='manual';

const $=id=>document.getElementById(id);
const els={search:$('searchInput'),list:$('cardList'),count:$('resultCount'),title:$('resultsTitle'),cardDialog:$('cardDialog'),formDialog:$('formDialog'),toolsDialog:$('toolsDialog'),toast:$('toast')};

function loadCards(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(saved)&&saved.length?saved:structuredClone(sampleCards)}catch{return structuredClone(sampleCards)}}
function saveCards(){localStorage.setItem(STORAGE_KEY,JSON.stringify(cards))}
function saveFavs(){localStorage.setItem(FAV_KEY,JSON.stringify([...favourites]))}
function slugify(s){return s.toLowerCase().trim().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`spell-${Date.now()}`}
function arr(v){return Array.isArray(v)?v:(v?String(v).split('\n').map(x=>x.trim()).filter(Boolean):[])}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function searchable(c){return [c.title,c.situation,c.underneath,c.goal,c.tiny_finesse,c.low_mana_version,c.repair_version,c.notes,...arr(c.tags),...arr(c.what_miki_might_say),...arr(c.say_this),...arr(c.avoid_saying)].join(' ').toLowerCase()}

const SPELL_FIELDS=['id','title','situation','tags','what_miki_might_say','underneath','goal','say_this','avoid_saying','tiny_finesse','low_mana_version','repair_version','related_spells','notes'];
const ARRAY_FIELDS=new Set(['tags','what_miki_might_say','say_this','avoid_saying','related_spells']);
function cleanJsonText(text){
  return String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
}
function normaliseCard(raw,index=0){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`Spell ${index+1} is not a JSON object.`);
  const title=String(raw.title||'').trim();
  const situation=String(raw.situation||'').trim();
  if(!title)throw new Error(`Spell ${index+1} needs a title.`);
  if(!situation)throw new Error(`“${title}” needs a situation.`);
  const card={};
  for(const field of SPELL_FIELDS){
    if(ARRAY_FIELDS.has(field)){
      const value=raw[field];
      card[field]=Array.isArray(value)?value.map(x=>String(x).trim()).filter(Boolean):arr(value);
    }else{
      card[field]=String(raw[field]??'').trim();
    }
  }
  card.id=slugify(card.id||title);
  return card;
}
function parseSpellJson(text){
  const parsed=JSON.parse(cleanJsonText(text));
  const input=Array.isArray(parsed)?parsed:[parsed];
  if(!input.length)throw new Error('The JSON array is empty.');
  return input.map(normaliseCard);
}
function mergeCards(incoming){
  let added=0,updated=0;
  for(const card of incoming){
    const i=cards.findIndex(c=>c.id===card.id);
    if(i>=0){cards[i]=card;updated++;}else{cards.unshift(card);added++;}
  }
  saveCards();render();
  return {added,updated};
}

function render(){
  const q=state.query.trim().toLowerCase();
  const filtered=cards.filter(c=>(!q||searchable(c).includes(q))&&(!state.favouritesOnly||favourites.has(c.id)));
  els.count.textContent=`${filtered.length} ${filtered.length===1?'spell':'spells'}`;
  els.title.textContent=q?'Matching spells':state.favouritesOnly?'Favourite spells':'All spells';
  els.list.innerHTML=filtered.length?filtered.map(c=>`<button class="spell-card" data-id="${esc(c.id)}"><div class="spell-card-top"><div><h3>${esc(c.title)}</h3><p>${esc(c.situation)}</p></div><span class="star">${favourites.has(c.id)?'★':''}</span></div>${state.lowMana&&c.low_mana_version?`<div class="low-script">${esc(c.low_mana_version)}</div>`:''}<div class="mini-tags">${arr(c.tags).slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('')}</div></button>`).join(''):`<div class="empty"><strong>No matching spells.</strong><p>Try fewer words, or add a new card for this particular small-human side quest.</p></div>`;
  els.list.querySelectorAll('.spell-card').forEach(b=>b.addEventListener('click',()=>openCard(b.dataset.id)));
}

function section(title,value,cls=''){
  if(!value||(Array.isArray(value)&&!value.length))return'';
  const body=Array.isArray(value)?`<ul>${value.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p>${esc(value)}</p>`;
  return `<section class="detail-section ${cls}"><h3>${title}</h3>${body}</section>`;
}
function openCard(id){
  activeCard=cards.find(c=>c.id===id);if(!activeCard)return;
  $('detailTitle').textContent=activeCard.title;
  $('favouriteBtn').textContent=favourites.has(id)?'★':'☆';
  $('detailBody').innerHTML=state.lowMana
    ? section('Low-mana version',activeCard.low_mana_version,'mana-section')+section('Say this',arr(activeCard.say_this),'script-section')+section('Repair version',activeCard.repair_version,'repair-section')
    : section('Low-mana version',activeCard.low_mana_version,'mana-section')
      +section('Say this',arr(activeCard.say_this),'script-section')
      +section('Goal',activeCard.goal)
      +section('Situation / Trigger',activeCard.situation)
      +section('What Miki might say',arr(activeCard.what_miki_might_say))
      +section('What’s probably happening underneath',activeCard.underneath)
      +section('Tiny finesse',activeCard.tiny_finesse)
      +section('Avoid saying',arr(activeCard.avoid_saying),'avoid-section')
      +section('Repair version',activeCard.repair_version,'repair-section')
      +section('Related spells',arr(activeCard.related_spells))
      +section('Notes / real-life examples',activeCard.notes)
      +section('Tags',arr(activeCard.tags),'tags-section');
  els.cardDialog.showModal();
}
function markdown(c){
  const list=(label,v)=>arr(v).length?`## ${label}\n${arr(v).map(x=>`- ${x}`).join('\n')}\n\n`:'';
  const text=(label,v)=>v?`## ${label}\n${v}\n\n`:'';
  return `# ${c.title}\n\n**Situation / Trigger:** ${c.situation||''}\n\n**Tags:** ${arr(c.tags).join(', ')}\n\n${list('What Miki might say',c.what_miki_might_say)}${text('What’s probably happening underneath',c.underneath)}${text('Goal',c.goal)}${list('Say this',c.say_this)}${list('Avoid saying',c.avoid_saying)}${text('Tiny finesse',c.tiny_finesse)}${text('Low-mana version',c.low_mana_version)}${text('Repair version',c.repair_version)}${list('Related spells',c.related_spells)}${text('Notes / real-life examples',c.notes)}`.trim();
}
function chatPrompt(c,liveSituation=''){
  const situation=liveSituation.trim()||'[REPLACE THIS: What is happening right now? What is Miki saying or doing? What stage are we at — getting dressed, shoes, car, drop-off, bedtime, food, play, etc.?]';
  return `Here is a Tiny Companion Spellbook card. Help me apply or improve it for this live parenting situation.\n\nLive situation:\n${situation}\n\nKeep the advice practical, warm, non-shaming, and suitable for a tired disabled parent and a 3.5-year-old child. Prioritise short usable scripts and include a low-mana option if helpful.\n\nSpell card:\n${markdown(c)}`;
}
async function copy(text,msg){await navigator.clipboard.writeText(text);toast(msg)}
function toast(msg){els.toast.textContent=msg;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),1800)}

function setAddMethod(method){
  addMethod=method;
  const manual=method==='manual';
  $('manualFields').classList.toggle('hidden',!manual);
  $('jsonFields').classList.toggle('hidden',manual);
  $('manualTab').classList.toggle('active',manual);
  $('jsonTab').classList.toggle('active',!manual);
  $('manualTab').setAttribute('aria-selected',manual);
  $('jsonTab').setAttribute('aria-selected',!manual);
  $('title').required=manual;
  $('situation').required=manual;
  $('saveSpellBtn').textContent=manual?'Save spell':'Add JSON spell';
  if(!manual)setTimeout(()=>$('jsonPaste').focus(),50);
}
function openForm(card=null){
  if(els.cardDialog.open)els.cardDialog.close();
  $('formTitle').textContent=card?'Edit spell':'Add spell';
  $('deleteBtn').classList.toggle('hidden',!card);
  $('addMethodTabs').classList.toggle('hidden',!!card);
  const v=(id,val='')=>$(id).value=val??'';
  v('cardId',card?.id);v('title',card?.title);v('situation',card?.situation);v('tags',arr(card?.tags).join(', '));v('whatMiki',arr(card?.what_miki_might_say).join('\n'));v('underneath',card?.underneath);v('goal',card?.goal);v('sayThis',arr(card?.say_this).join('\n'));v('avoidSaying',arr(card?.avoid_saying).join('\n'));v('tinyFinesse',card?.tiny_finesse);v('lowMana',card?.low_mana_version);v('repair',card?.repair_version);v('related',arr(card?.related_spells).join(', '));v('notes',card?.notes);
  v('jsonPaste','');$('jsonStatus').textContent='';$('jsonStatus').className='json-status';
  setAddMethod('manual');
  els.formDialog.showModal();
}
function splitComma(v){return v.split(',').map(x=>x.trim()).filter(Boolean)}
$('cardForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(addMethod==='json'&&!$('cardId').value){
    try{
      const incoming=parseSpellJson($('jsonPaste').value);
      const {added,updated}=mergeCards(incoming);
      els.formDialog.close();
      const parts=[];if(added)parts.push(`${added} added`);if(updated)parts.push(`${updated} updated`);
      toast(`JSON spells: ${parts.join(', ')}`);
    }catch(error){
      $('jsonStatus').textContent=error instanceof SyntaxError?'That is not valid JSON yet. Check commas, quotes, and brackets.':error.message;
      $('jsonStatus').className='json-status invalid';
    }
    return;
  }
  const existingId=$('cardId').value;
  const card={id:existingId||slugify($('title').value),title:$('title').value.trim(),situation:$('situation').value.trim(),tags:splitComma($('tags').value),what_miki_might_say:arr($('whatMiki').value),underneath:$('underneath').value.trim(),goal:$('goal').value.trim(),say_this:arr($('sayThis').value),avoid_saying:arr($('avoidSaying').value),tiny_finesse:$('tinyFinesse').value.trim(),low_mana_version:$('lowMana').value.trim(),repair_version:$('repair').value.trim(),related_spells:splitComma($('related').value),notes:$('notes').value.trim()};
  const i=cards.findIndex(c=>c.id===existingId);if(i>=0)cards[i]=card;else cards.unshift(card);saveCards();els.formDialog.close();render();toast(existingId?'Spell updated':'Spell added')
});
$('manualTab').onclick=()=>setAddMethod('manual');
$('jsonTab').onclick=()=>setAddMethod('json');
$('jsonPaste').addEventListener('input',()=>{
  const text=$('jsonPaste').value.trim();
  if(!text){$('jsonStatus').textContent='';$('jsonStatus').className='json-status';return;}
  try{
    const parsed=parseSpellJson(text);
    $('jsonStatus').textContent=`Ready to add ${parsed.length} ${parsed.length===1?'spell':'spells'}.`;
    $('jsonStatus').className='json-status valid';
  }catch(error){
    $('jsonStatus').textContent=error instanceof SyntaxError?'Keep pasting — the JSON is not complete yet.':error.message;
    $('jsonStatus').className='json-status invalid';
  }
});

$('searchInput').addEventListener('input',e=>{state.query=e.target.value;render()});$('clearSearch').onclick=()=>{state.query='';els.search.value='';render();els.search.focus()};
$('lowManaToggle').onclick=e=>{state.lowMana=!state.lowMana;e.currentTarget.setAttribute('aria-pressed',state.lowMana);render()};
$('favouritesToggle').onclick=e=>{state.favouritesOnly=!state.favouritesOnly;e.currentTarget.setAttribute('aria-pressed',state.favouritesOnly);render()};
$('randomBtn').onclick=()=>{const pool=cards.filter(c=>!state.favouritesOnly||favourites.has(c.id));if(pool.length)openCard(pool[Math.floor(Math.random()*pool.length)].id)};
$('addBtn').onclick=()=>openForm();$('closeDetail').onclick=()=>els.cardDialog.close();$('closeForm').onclick=$('cancelForm').onclick=()=>els.formDialog.close();$('editBtn').onclick=()=>openForm(activeCard);
$('favouriteBtn').onclick=()=>{if(!activeCard)return;favourites.has(activeCard.id)?favourites.delete(activeCard.id):favourites.add(activeCard.id);saveFavs();$('favouriteBtn').textContent=favourites.has(activeCard.id)?'★':'☆';render()};
$('copyMarkdownBtn').onclick=()=>copy(markdown(activeCard),'Card copied as Markdown');
$('copyPromptBtn').onclick=()=>{
  $('liveSituationInput').value='';
  $('liveSituationDialog').showModal();
  setTimeout(()=>$('liveSituationInput').focus(),50);
};
$('closeLiveSituation').onclick=$('cancelLiveSituation').onclick=()=>$('liveSituationDialog').close();
$('liveSituationForm').addEventListener('submit',async e=>{
  e.preventDefault();
  await copy(chatPrompt(activeCard,$('liveSituationInput').value),'ChatGPT prompt copied');
  $('liveSituationDialog').close();
});
$('deleteBtn').onclick=()=>{const id=$('cardId').value;if(!id||!confirm('Delete this spell card?'))return;cards=cards.filter(c=>c.id!==id);favourites.delete(id);saveCards();saveFavs();els.formDialog.close();render();toast('Spell deleted')};
$('settingsBtn').onclick=()=>els.toolsDialog.showModal();$('closeTools').onclick=()=>els.toolsDialog.close();
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('exportJsonBtn').onclick=()=>download('tiny-companion-spellbook.json',JSON.stringify(cards,null,2),'application/json');
$('exportMarkdownBtn').onclick=()=>download('tiny-companion-spellbook.md',cards.map(markdown).join('\n\n---\n\n'),'text/markdown');
$('copyAllPromptBtn').onclick=()=>copy(`Here is my Tiny Companion Spellbook database. Help me maintain, improve, deduplicate, or add cards while preserving the JSON structure and warm, practical, non-shaming tone. Return valid JSON when suggesting database changes.\n\n${JSON.stringify(cards,null,2)}`,'Full database copied for ChatGPT');
$('importInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!Array.isArray(parsed))throw new Error();cards=parsed;saveCards();render();els.toolsDialog.close();toast(`${cards.length} spells imported`)}catch{alert('That file does not appear to be a valid spellbook JSON array.')}e.target.value=''});
$('restoreSamplesBtn').onclick=()=>{if(confirm('Restore the sample cards? Your current cards will be replaced.')){cards=structuredClone(sampleCards);saveCards();render();els.toolsDialog.close();toast('Sample cards restored')}};

render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
