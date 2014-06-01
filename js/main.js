(function () {
    function loadObjects(callback) {
        // Load every resource we need
        var modelPaths = [];
        for (var fileName in modelFiles) {
            modelPaths.push(fileName);
        }

        async.map(modelPaths,
            function (path, callback) {
                loader.getResource(path, function (body) {
                    modelFiles[path] = loader.parseObj(path, body);
                    callback(undefined, body);
                });
            },
            callback
        );
    };

    function loadTextures(callback) {
        // Load every resource we need
        var imagePaths = [];
        for (var fileName in imageFiles) {
            imagePaths.push(fileName);
        }

        async.map(imagePaths,
            function (path, callback) {
                var image = new Image();
                image.onload = function imageLoadedCallback() {
                    imageFiles[path] = image;
                    callback(undefined, image);
                }
                image.src = path;
            },
            callback);
    }


    var modelFiles = {
        './objects/cube.obj' : null
    };

    var imageFiles = {
        './textures/stone.jpg': null,
        './textures/stone_red.jpg': null,
        './textures/solid.png': null
    };


    function allResourcesLoaded() {
        console.log("All resources loaded!");

        var models = {
//            teapot: modelFiles['./objects/teapot.obj'],
            cube: modelFiles['./objects/cube.obj'],
            sphere: Model.createSphere()
        };

        var images = {
            'stone': imageFiles['./textures/stone.jpg'],
            'stone_red': imageFiles['./textures/stone_red.jpg'],
            'solid': imageFiles['./textures/solid.png']
        };

        renderer.start(models, images);
    }

    async.parallel(
        [loadObjects, loadTextures],
        allResourcesLoaded);
})();

