function Physics() {
    var lastUpdateTime = 0;

    var entities = [];

    var movingParts = [];

    var collisionDamping = 0.5;

    var collisionHandlers = {
        sphere : {
            box : detectSphereBoxCollision,
            sphere : detectSphereSphereCollision
        }
    };

    function tick(gravity) {
        var currentTime = (new Date).getTime();
        var timeDelta = Math.min(currentTime - lastUpdateTime, 50);
        lastUpdateTime = currentTime;


        // Update the velocity for each non-stationary entity
        for (var i = 0; i < movingParts.length; i++) {
            movingParts[i].move(timeDelta);
        }

        processCollisions();

        for (var i = 0; i < movingParts.length; i++) {
            movingParts[i].accelerate(gravity, timeDelta);
        }
    }


    function processCollisions() {
        for (var i = 0; i < movingParts.length; i++) {
            var movingPart = movingParts[i];

            for (var j = 0; j < entities.length; j++) {
                var entity = entities[j];

                // Things can't collide with themselves
                if (movingPart === entity) continue;

                var collision = detectCollision(movingPart, entity);

                if (collision) {
                    // Update velocities
                    entity.sharedProperties.colliding = 100;

                    // Dispatch collision events
                    entity.collision(movingPart);
                    movingPart.collision(entity);
                }
                else {
                    entity.sharedProperties.colliding -= 1;
                }
            }

        }
    }

    function detectCollision(a, b) {
        // Optimistic collision handler lookup
        try {
            return collisionHandlers[a.type][b.type](a, b);
        }
        catch (e) {
            console.error("Could not process collision between " + a.type + " and " + b.type);
            console.error(e);
            return false;
        }
    }

    function detectSphereBoxCollision(sphere, box) {
        var relCenter = subtractVector(sphere.position, box.position);

        var closestPoint = vec3.create();

        for (var i = 0; i < 3; i++) {
            if (relCenter[i] < -box.halfSize[i]) {
                closestPoint[i] = -box.halfSize[i];
            }
            else if (relCenter[i] > box.halfSize[i]) {
                closestPoint[i] = box.halfSize[i]
            }
            else {
                closestPoint[i] = relCenter[i];
            }
        }

        var dist = vec3.distance(relCenter, closestPoint);

        if (dist > sphere.radius) {
            return false;
        }

        // Generate collision normal
        var maxIdx = 0;
        for (var i = 0; i < relCenter.length; i++) {
            if (Math.abs(relCenter[i]) > Math.abs(relCenter[maxIdx])) {
                maxIdx = i;
            }
        }

        var sign = relCenter[maxIdx] / (Math.abs(relCenter[maxIdx]));

        var normal = [0, 0, 0];
        normal[maxIdx] = sign;


        // Collision response
        // Move the sphere off of the box
        sphere.position[maxIdx] = box.position[maxIdx] + sign * (sphere.radius + box.halfSize[maxIdx]);

        // Update the sphere's collision
        var vr = vec3.create(), vt = vec3.create();
        vec3.scale(vr, normal, dot(normal, sphere.velocity));
        vec3.subtract(vt, sphere.velocity, vr);
        vec3.scale(vr, vr, collisionDamping);
        vec3.sub(sphere.velocity, vt, vr);

        return true;
    }

    function calcVectorComponents(velocityVector, collisionNormal) {
        var inlineVelocity = vec3.create(), tangentVelocity = vec3.create();

        // inline = collisionNormal * dot(collisionNormal
        vec3.scale(inlineVelocity, collisionNormal, vec3.dot(collisionNormal, velocityVector));
        vec3.subtract(tangentVelocity, velocityVector, inlineVelocity);
        vec3.scale(inlineVelocity, inlineVelocity, collisionDamping);

        return [inlineVelocity, tangentVelocity];
    }

    function detectSphereSphereCollision(a, b) {
        var gap = vec3.subtract(vec3.create(), a.position, b.position);

        var displacement = vec3.length(gap);
        var separation = displacement - (a.radius + b.radius);

        // If the spheres are separated, there is no collision.
        if (separation > 0) {
            return false;
        }

        // The spheres are colliding, let's roll
        var normal = vec3.normalize(vec3.create(), gap);

        var aComponents = calcVectorComponents(a.velocity, normal);
        var bComponents = calcVectorComponents(b.velocity, normal);

        var inlineVelocity = vec3.add(vec3.create(), aComponents[0], bComponents[0]);
        vec3.scale(inlineVelocity, inlineVelocity, 0.5);

        vec3.add(a.velocity, aComponents[1], inlineVelocity);
        vec3.sub(b.velocity, bComponents[1], inlineVelocity);

        vec3.add(a.position, b.position, vec3.scale(vec3.create(), normal, (a.radius + b.radius)));

        return true;
    }

    function addEntity(entity) {
        entities.push(entity);

        if (!entity.stationary) {
            movingParts.push(entity);
        }
    }

    function addEntities(newEntities) {
        for (var i = 0; i < newEntities.length; i++) {
            addEntities(newEntities[i]);
        }
    }

    function reset() {
        lastUpdateTime = 0;
        entities.length = 0;
        movingParts.length = 0;
    }

    return {
        tick: tick,
        addEntity: addEntity,
        addEntities: addEntities,
        reset: reset
    }
}
