// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global Box2DTest Box2D */

/* This code was adapted from code here:

   https://github.com/kripken/bench2d/blob/master/js/Box2dWeb-2.1a.3/demo.html
*/

sc_require('box2d');

function init(stage) {
  var b2Vec2 = Box2D.Common.Math.b2Vec2,
      b2AABB = Box2D.Collision.b2AABB,
      b2BodyDef = Box2D.Dynamics.b2BodyDef,
      b2Body = Box2D.Dynamics.b2Body,
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
      b2Fixture = Box2D.Dynamics.b2Fixture,
      b2World = Box2D.Dynamics.b2World,
      b2MassData = Box2D.Collision.Shapes.b2MassData,
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
      b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;
  
  var world = new b2World(
        new b2Vec2(0, 10)    //gravity
     ,  true                 //allow sleep
  );
  
  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;
  
  var bodyDef = new b2BodyDef;
  
  //create ground
  bodyDef.type = b2Body.b2_staticBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(20, 2);
  bodyDef.position.Set(10, 400 / 30 + 1.8);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(10, -1.8);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  fixDef.shape.SetAsBox(2, 14);
  bodyDef.position.Set(-1.8, 13);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(21.8, 13);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  
  
  //create some objects
  bodyDef.type = b2Body.b2_dynamicBody;
  for(var i = 0; i < 10; ++i) {
     if(Math.random() > 0.5) {
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(
              Math.random() + 0.1 //half width
           ,  Math.random() + 0.1 //half height
        );
     } else {
        fixDef.shape = new b2CircleShape(
           Math.random() + 0.1 //radius
        );
     }
     bodyDef.position.x = Math.random() * 10;
     bodyDef.position.y = Math.random() * 10;
     world.CreateBody(bodyDef).CreateFixture(fixDef);
  }
  
  //setup debug draw
  var debugDraw = new b2DebugDraw();
   debugDraw.SetSprite(stage.get('context'));
   debugDraw.SetDrawScale(30.0);
   debugDraw.SetFillAlpha(0.5);
   debugDraw.SetLineThickness(1.0);
   debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
   world.SetDebugDraw(debugDraw);
  
  //mouse
  
  var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
  var pos = stage.computeContainerPosition();
  var canvasPosition = { x: pos.left, y: pos.top };
  
  document.addEventListener("mousedown", function(e) {
     isMouseDown = true;
     handleMouseMove(e);
     document.addEventListener("mousemove", handleMouseMove, true);
  }, true);
  
  document.addEventListener("mouseup", function() {
     document.removeEventListener("mousemove", handleMouseMove, true);
     isMouseDown = false;
     mouseX = undefined;
     mouseY = undefined;
  }, true);
  
  function handleMouseMove(e) {
     mouseX = (e.clientX - canvasPosition.x) / 30;
     mouseY = (e.clientY - canvasPosition.y) / 30;
  };
  
  function getBodyAtMouse() {
     mousePVec = new b2Vec2(mouseX, mouseY);
     var aabb = new b2AABB();
     aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
     aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
     
     // Query the world for overlapping shapes.
  
     selectedBody = null;
     world.QueryAABB(getBodyCB, aabb);
     return selectedBody;
  }
  
  function getBodyCB(fixture) {
     if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
        if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
           selectedBody = fixture.GetBody();
           return false;
        }
     }
     return true;
  }
  
  function update(lastTime) {
    var date = new Date(),
        time = date.getTime(),
        timeDiff = (time - lastTime)/1000;

     if (isMouseDown && (!mouseJoint)) {
        var body = getBodyAtMouse();
        if (body) {
           var md = new b2MouseJointDef();
           md.bodyA = world.GetGroundBody();
           md.bodyB = body;
           md.target.Set(mouseX, mouseY);
           md.collideConnected = true;
           md.maxForce = 300.0 * body.GetMass();
           mouseJoint = world.CreateJoint(md);
           body.SetAwake(true);
        }
     }
     
     if (mouseJoint) {
        if (isMouseDown) {
           mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
        } else {
           world.DestroyJoint(mouseJoint);
           mouseJoint = null;
        }
     }

     world.Step(timeDiff, 10, 10);
     world.DrawDebugData();
     world.ClearForces();

     window.requestAnimFrame(function() { update(time); });
  };
  
  window.requestAnimFrame = function(callback) {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { window.setTimeout(callback, 1000 / 60); };
  }();

  console.log("1/60 is "+1/60);
  update(new Date().getTime());
}

function main() {
  var stage = SC.StagePane.create({
    layout: { top: 20, left: 20, width: 600, height: 600 },
    containerId: 'container'
  });

  stage.attach(); // Must currently attach *before* adding shapes.

  init(stage);
}