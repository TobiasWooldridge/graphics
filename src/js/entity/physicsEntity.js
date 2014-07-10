function createPhysicsEntity(baseEntity, properties) {

    var callbacks = [];

    var physicsEntity = {
        position: baseEntity.position,
        model: baseEntity.model,
        sharedProperties: baseEntity.properties,
        velocity: [0, 0, 0],
        move: function move(time) {
            this.position[0] += this.velocity[0] * (time / 500);
            this.position[1] += this.velocity[1] * (time / 500);
            this.position[2] += this.velocity[2] * (time / 500);
        },
        accelerate: function accelerate(acceleration, time) {
            this.velocity[0] += acceleration[0] * (time / 500);
            this.velocity[1] += acceleration[1] * (time / 500);
            this.velocity[2] += acceleration[2] * (time / 500);
        },
        collision: function (collidee) {
            if (!callbacks.length) {
                return;
            }

            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](collidee);
            }
        },
        addCollisionEvent: function (e) {
            callbacks.push(e);
        },
        removeCollisionEvent: function (e) {
            callbacks.remove(e);
        }
    };

    for (var property in properties) {
        if (properties.hasOwnProperty(property)) {
            physicsEntity[property] = properties[property];
        }
    }


    return physicsEntity;
}
