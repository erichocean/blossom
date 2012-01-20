// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global BulletTest */

/*
  This demo is adapted from code copyright (c) 2011 ammo.js contributors

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.

  See: https://github.com/kripken/ammo.js
*/

sc_require('ammo');

BulletTest.bulletExample = function(stage) {
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(); // every single |new| currently leaks...
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();
    var dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50));

    var bodies = [];

    var groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -56, 0));

    (function() {
      var mass = 0;
      var isDynamic = mass !== 0;
      var localInertia = new Ammo.btVector3(0, 0, 0);

      if (isDynamic)
        groundShape.calculateLocalInertia(mass, localInertia);

      var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
      var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
      rbInfo.set_m_restitution(0.99); // make it bouncy
      var body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);
      bodies.push(body);
    })();

    (function() {
      var colShape = new Ammo.btSphereShape(1);

      var startTransform = new Ammo.btTransform();
      startTransform.setIdentity();

      var mass = 1;
      var isDynamic = (mass != 0);

      var localInertia = new Ammo.btVector3(0, 0, 0);
      if (isDynamic)
        colShape.calculateLocalInertia(mass,localInertia);

      startTransform.setOrigin(new Ammo.btVector3(2, stage.get('height')*0.9, 0));

      var myMotionState = new Ammo.btDefaultMotionState(startTransform);
      var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia);
      rbInfo.set_m_restitution(0.99); // make it bouncy
      var body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);
      bodies.push(body);
    })();

    window.requestAnimFrame = function(callback) {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) { window.setTimeout(callback, 1000 / 60); };
    }();

    var trans = new Ammo.btTransform(); // taking this out of animate() reduces leaking

    bodies[1].getMotionState().getWorldTransform(trans);
    var height = stage.get('height')-10; // offset of sphere at bottom
    var sphere = SC.Shape.create({
      x: stage.get('width') / 2,
      y: height - trans.getOrigin().y(),

      draw: function(context) {
        context.beginPath();
        context.lineWidth = 2;
        context.strokeStyle = "#666";
        context.fillStyle = "#ddd";
        context.arc(0, 0, 5, 0, 2 * Math.PI, false);
        context.closePath();
        context.fill();
        context.stroke();
      }
    });

    stage.add(sphere);

    function animate(lastTime, stage) {
      var date = new Date(),
          time = date.getTime(),
          timeDiff = time - lastTime,
          shapes = stage.getPath('actors.shapes');

      // run Bullet
      dynamicsWorld.stepSimulation(timeDiff, 10);

      // update sphere position
      bodies[1].getMotionState().getWorldTransform(trans);
      sphere.set('y', height - trans.getOrigin().y());

      stage.draw();
      window.requestAnimFrame(function() { animate(time, stage); });
    }

    animate(new Date().getTime(), stage);
} ;