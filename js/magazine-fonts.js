'use strict';
window.MagazineFonts=(()=>{
  const englishFonts={
    'Instrument Serif':['Instrument Serif',400,'normal'],'Instrument Serif Italic':['Instrument Serif',400,'italic'],
    'Forum':['Forum',400,'normal'],'Corben':['Corben',400,'normal'],'Corben Bold':['Corben',700,'normal'],
    'Arapey':['Arapey',400,'normal'],'Arapey Italic':['Arapey',400,'italic'],'BBH Hegarty':['BBH Hegarty',400,'normal'],
    'Montenegrin Gothic One':['Montenegrin Gothic One',400,'normal'],'Beau Rivage':['Beau Rivage',400,'normal'],'Alfa Slab One':['Alfa Slab One',400,'normal'],
    'Rock Salt':['Rock Salt',400,'normal'],'Homemade Apple':['Homemade Apple',400,'normal'],'Special Elite':['Special Elite',400,'normal'],
    'Josefin Slab Thin':['Josefin Slab',100,'normal'],'Josefin Slab ExtraLight':['Josefin Slab',200,'normal'],'Josefin Slab Light':['Josefin Slab',300,'normal'],'Josefin Slab':['Josefin Slab',400,'normal'],'Josefin Slab Medium':['Josefin Slab',500,'normal'],'Josefin Slab SemiBold':['Josefin Slab',600,'normal'],'Josefin Slab Bold':['Josefin Slab',700,'normal'],
    'Josefin Slab Thin Italic':['Josefin Slab',100,'italic'],'Josefin Slab ExtraLight Italic':['Josefin Slab',200,'italic'],'Josefin Slab Light Italic':['Josefin Slab',300,'italic'],'Josefin Slab Italic':['Josefin Slab',400,'italic'],'Josefin Slab Medium Italic':['Josefin Slab',500,'italic'],'Josefin Slab SemiBold Italic':['Josefin Slab',600,'italic'],'Josefin Slab Bold Italic':['Josefin Slab',700,'italic'],
    'Cormorant Upright Light':['Cormorant Upright',300,'normal'],'Cormorant Upright':['Cormorant Upright',400,'normal'],'Cormorant Upright Medium':['Cormorant Upright',500,'normal'],'Cormorant Upright SemiBold':['Cormorant Upright',600,'normal'],'Cormorant Upright Bold':['Cormorant Upright',700,'normal']
  };
  const japaneseFonts={
    'Dela Gothic One':['Dela Gothic One',400,'normal'],'Kosugi Maru':['Kosugi Maru',400,'normal'],
    'Murecho Thin':['Murecho',100,'normal'],'Murecho ExtraLight':['Murecho',200,'normal'],'Murecho Light':['Murecho',300,'normal'],'Murecho':['Murecho',400,'normal'],'Murecho Medium':['Murecho',500,'normal'],'Murecho SemiBold':['Murecho',600,'normal'],'Murecho Bold':['Murecho',700,'normal'],'Murecho ExtraBold':['Murecho',800,'normal'],'Murecho Black':['Murecho',900,'normal'],
    'Kiwi Maru':['Kiwi Maru',400,'normal'],'Hina Mincho':['Hina Mincho',400,'normal'],'Shippori Antique B1':['Shippori Antique B1',400,'normal']
  };
  const simplifiedChineseFonts=Object.fromEntries([100,200,300,400,500,600,700,800,900].map(weight=>[`Noto Sans SC ${weight}`,['Noto Sans SC',weight,'normal']]));
  const traditionalChineseFonts=Object.fromEntries([100,200,300,400,500,600,700,800,900].map(weight=>[`Noto Sans TC ${weight}`,['Noto Sans TC',weight,'normal']]));
  const koreanFonts={
    JoseonGulim:['JoseonGulim',400,'normal'],'JeonjuCraftMyungjo Light':['JeonjuCraftMyungjo',300,'normal'],'JeonjuCraftMyungjo Bold':['JeonjuCraftMyungjo',700,'normal'],
    BookkMyungjo:['BookkMyungjo',400,'normal'],'BookkMyungjo Bold':['BookkMyungjo',700,'normal'],Ridibatang:['Ridibatang',400,'normal'],
    GyeonggiMillenniumBackground:['GyeonggiMillenniumBackground',400,'normal'],'GyeonggiMillenniumBackground Bold':['GyeonggiMillenniumBackground',700,'normal'],
    JoseonBoldMyongjo:['JoseonBoldMyongjo',400,'normal'],'Soonbatang Light':['Soonbatang',300,'normal'],'Soonbatang Medium':['Soonbatang',500,'normal'],'Soonbatang Bold':['Soonbatang',700,'normal'],
    ...Object.fromEntries([100,200,300,400,500,600,700,800,900].map(weight=>[`Noto Sans KR ${weight}`,['Noto Sans KR',weight,'normal']]))
  };
  const fonts={Scene:['Scene',400,'normal'],SceneMedium:['Scene',600,'normal'],MagazineText:['MagazineText',400,'normal'],...englishFonts,...japaneseFonts,...simplifiedChineseFonts,...traditionalChineseFonts,...koreanFonts};
  function font(key,size){const [family,weight,style]=fonts[key];return `${style} ${weight} ${size}px "${family}", MagazineText, serif`;}
  const fontLanguages=[['기본',{Scene:fonts.Scene,MagazineText:fonts.MagazineText}],['영어',englishFonts],['일본어',japaneseFonts],['중국어 간체',simplifiedChineseFonts],['중국어 번체',traditionalChineseFonts],['한글',koreanFonts]];
  const sansFamilies=new Set(['Scene','MagazineText','BBH Hegarty','Montenegrin Gothic One','Dela Gothic One','Kosugi Maru','Murecho','Shippori Antique B1','Noto Sans SC','Noto Sans TC','JoseonGulim','Noto Sans KR']);
  const otherFamilies=new Set(['Beau Rivage','Rock Salt','Homemade Apple','Special Elite']);
  const familyNames={Scene:'기본 고딕',MagazineText:'기본 본문',JoseonGulim:'조선굴림',JeonjuCraftMyungjo:'전주공예명조',BookkMyungjo:'부크크명조',Ridibatang:'리디바탕',GyeonggiMillenniumBackground:'경기천년바탕',JoseonBoldMyongjo:'조선굵은명조',Soonbatang:'순바탕'};
  const families=new Map();
  for(const [language,choices] of fontLanguages)for(const [key,[family,weight,italic]] of Object.entries(choices)){
    if(!families.has(family))families.set(family,{family,language,category:sansFamilies.has(family)?'고딕':otherFamilies.has(family)?'그외':'세리프',variants:[]});
    families.get(family).variants.push({key,weight,italic});
  }
return {fonts,font,fontLanguages,families,familyNames};
})();
