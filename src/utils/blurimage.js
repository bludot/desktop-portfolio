import Blur from "./blur";
function blur(img, blurAmount, resolve) {
    var blur = new Blur({
        radius: blurAmount || 30,
        // gaussian: true
        stack: true
    });
    blur.init();
    // var img =  obj ; // a  Image or Canvas
    var blurImg = blur.blurRGBA(img, null, true);
    var data = blurImg.toDataURL("image/png");
    var testimg = new Image();
    testimg.src = data;
    // document.body.appendChild(testimg);
    return resolve(data);
}
export function blurImage(src, blurAmount) {
    return new Promise(function (resolve) {
        var img = new Image();
        img.style.position = "absolute";
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            var complete = function (data) {
                return setTimeout(function () {
                    resolve(data);
                }, 500);
            };
            blur(this, blurAmount, complete);
        }.bind(img);
        img.src = src;
        img.style.zIndex = "0";
        img.style.opacity = "0";
        document.body.appendChild(img);
    });
    // or in shorthand
    // blurify(6, document.querySelectorAll(".blurify"));
}
//# sourceMappingURL=blurimage.js.map