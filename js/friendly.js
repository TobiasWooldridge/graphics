var _ = {
    pushAll: function pushAll(base, ext) {
        base.push.apply(base, ext);
    },

    push3: function pushAll(base, ext) {
        base.push(ext[0], ext[1], ext[2]);
    },

    push4: function pushAll(base, ext) {
        base.push(ext[0], ext[1], ext[2], ext[3]);
    },

    // Curry function written by Douglas Crockford
    // http://www.crockford.com/javascript/www_svendtofte_com/code/curried_javascript/index.html
    curry: function curry(func, args, space) {
        var n = func.length - args.length; //arguments still to come
        var sa = Array.prototype.slice.apply(args); // saved accumulator array

        function accumulator(moreArgs, sa, n) {
            var saPrev = sa.slice(0); // to reset
            var nPrev = n; // to reset
            for (var i = 0; i < moreArgs.length; i++, n--) {
                sa[sa.length] = moreArgs[i];
            }
            if ((n - moreArgs.length) <= 0) {
                var res = func.apply(space, sa);
                // reset vars, so curried function can be applied to new params.
                sa = saPrev;
                n = nPrev;
                return res;
            } else {
                return function () {
                    // arguments are params, so closure bussiness is avoided.
                    return accumulator(arguments, sa.slice(0), n);
                }
            }
        }

        return accumulator([], sa, n);
    }
};