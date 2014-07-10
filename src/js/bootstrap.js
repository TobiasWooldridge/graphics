(function () {
    function loadObjects(callback) {
        // Load every resource we need
        var modelNames = [];
        for (var modelName in models) {
            modelNames.push(modelName);
        }

        async.map(modelNames,
            function (modelName, callback) {
                loader.getResource(models[modelName], function (body) {
                    models[modelName] = loader.parseObj(modelName, body);
                    callback(undefined, body);
                });
            },
            callback
        );
    }

    function loadTextures(callback) {
        // Load every resource we need
        var imageNames = [];
        for (var imageName in images) {
            imageNames.push(imageName);
        }

        async.map(imageNames,
            function (imageName, callback) {
                var image = new Image();
                image.onload = function imageLoadedCallback() {
                    images[imageName] = image;
                    callback(undefined, image);
                };
                image.src = images[imageName];
            },
            callback);
    }

    var models = {
        cube : './objects/cube.obj',
        block: './objects/block.obj',
        teapot: './objects/teapot.obj'
    };

    var images = {
        stone : './textures/stone.jpg',
        stoneRed : './textures/stone_red.jpg',
        solid : './textures/solid.png',
        solidRed : './textures/solid_red.png',
        box : './textures/box.png',
        boxRed : './textures/box_red.png',
        cubeDims: './textures/cubeDims.png',
        ball: './textures/ball.png'
    };


    function allResourcesLoaded() {
        console.log("All resources loaded!");

        // I generate a sphere because it seems more sensible to generate it than save it in a .obj
        models.sphere = Model.createSphere();

        Game().start(models, images);
    }

    async.parallel(
        [loadObjects, loadTextures],
        allResourcesLoaded);
})();

