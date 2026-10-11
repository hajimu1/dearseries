(()=>{
const keys={phone:'phone',background:'background',album:'album',profile:'profile',selfProfile:'selfProfile'};
function syncImage(){const key=$('imageSlot').value,prefix=keys[key];$('imagePreview').src=assets[key];$('imageUpload').dataset.asset=key;for(const [id,suffix] of [['imageCropX','X'],['imageCropY','Y'],['imageZoom','Zoom']])$(id).value=config[prefix+suffix];$('imageZoom').max=key==='phone'?2:3}
const originalSync=syncForm;syncForm=function(){originalSync();syncImage()};
$('imageSlot').onchange=syncImage;
for(const [id,suffix] of [['imageCropX','X'],['imageCropY','Y'],['imageZoom','Zoom']])$(id).oninput=()=>{const key=$('imageSlot').value;config[keys[key]+suffix]=Number($(id).value);if(key==='background'&&ready)prepareBackdrop();if(ready)draw(time)};
syncImage();
})();
