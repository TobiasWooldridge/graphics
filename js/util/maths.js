// TODO: Remove maths.js, it has been superceded in functionality by /lib/gl-matrix.js

function magnitude(v) {
    return Math.sqrt(squareMagnitude(v));
}

function normalize(v) {
    var mag = magnitude(v);
    return v.map(function (x) {
        return x / mag;
    });
}

function squareMagnitude(v) {
    return v.reduce(function (x, y) {
        return x + (y * y);
    }, 0);
}

function subtractVector(a, b) {
    if (a.length != b.length) {
        throw "Cannot subtract vectors of different length";
    }

    var result = [];
    for (var i = 0; i < a.length; i++) {
        result.push(a[i] - b[i]);
    }
    return result;
}


function scaleVector(a, n) {
    return a.map(function (x) {
        return x * n;
    });
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function randInt(low, high) {
    return Math.floor((Math.abs(Math.random()) * (high - low)) + low);
}