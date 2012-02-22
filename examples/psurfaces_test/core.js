/*globals base3 green */

var tree = SC.ContainerSurface.create();

function validatePsurfaces() {
  
}

function validateDOM() {
  
}

var surface = SC.View.create({

  updateDisplay: function() {
    var ctx = this.getPath('layer.context');

    // Draw background.
    ctx.fillStyle = base3;
    ctx.fillRect(0, 0, ctx.width, ctx.height);

    // Draw text.
    ctx.fillStyle = green;
    ctx.font = "16pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Welcome to the SC.Psurface fuzz tester.", ctx.width/2, (ctx.height/2)-60);
    ctx.fillText("Click anywhere to randomly modify the surface tree.", ctx.width/2, (ctx.height/2)-20);
    ctx.fillText("The corresponding Psurface and rendering tree (DOM)", ctx.width/2, (ctx.height/2)+20);
    ctx.fillText("is exhaustively verified after each modification.", ctx.width/2, (ctx.height/2)+60);
  },

  mouseDown: function() {
    var times = Math.floor(Math.random()*6); // up to 5 modifications
    while (times === 0) times = Math.floor(Math.random()*6);

    // Make up to five tree modifications.
    while (times--) modifyTree();

    // Update the Psurfaces tree manually (this is the code we are fuzz testing).
    tree.updatePsurfaceTree();

    // Validate the Psurfaces tree, and the DOM.
    validatePsurfaces();
    validateDOM();
  }

});

function fetchLeaf() {
  var ary = Object.keys(SC.surfaces),
      length = ary.length,
      idx = Math.floor(Math.random()*length),
      tries = 0, leaf;

  console.log(ary);
  leaf = SC.surfaces[ary[idx]];
  while (leaf && !leaf.isLeafSurface && tries++ !== length) {
    idx = Math.floor(Math.random()*length);
    leaf = SC.surfaces[ary[idx]];
  }
  return leaf.isLeafSurface? leaf : null;
}

function childIsInParent(parent, child) {
  var subsurfaces = parent.get('subsurfaces');

  function checkChildren(surface) {
    return childIsInParent(surface, child);
  }

  if (subsurfaces && subsurfaces.indexOf(child) >= 0) {
    return true;
  } else if (subsurfaces && subsurfaces.some(checkChildren)) {
    return true;
  } else {
    return false;
  }
}

function fetchComposite(parent, withChildren) {
  var ary = Object.keys(SC.surfaces),
      length = ary.length,
      idx = Math.floor(Math.random()*length),
      tries = 0, composite, found = false;

  composite = SC.surfaces[ary[idx]];
  while (!found && tries++ !== length) {
    if (composite && composite.isCompositeSurface) {
      if (withChildren && composite.getPath('subsurfaces.length') > 0) {
        if (parent) {
          if (!childIsInParent(parent, composite)) {
            found = true;
          } else {
            // Try again.
            idx = Math.floor(Math.random()*length);
            composite = SC.surfaces[ary[idx]];
          }
        } else {
          found = true;
        }
      } else if (!withChildren && composite.getPath('subsurfaces.length') === 0) {
        if (parent) {
          if (!childIsInParent(parent, composite)) {
            found = true;
          } else {
            // Try again.
            idx = Math.floor(Math.random()*length);
            composite = SC.surfaces[ary[idx]];
          }
        } else {
          found = true;
        }
      }
    } else {
      // Try again.
      idx = Math.floor(Math.random()*length);
      composite = ary[idx];
    }
  }

  return found? composite : null;
}

function insertChild(composite, child) {
  if (child === surface || child === tree) return false;
  var subsurfaces = composite.get('subsurfaces'),
      len = subsurfaces.get('length'),
      idx = Math.floor(Math.random()*len);

  subsurfaces.insertAt(idx, child);
  return true;
}

function removeChild(child) {
  if (child === surface || child === tree) return false;
  var supersurface = child.get('supersurface');
  supersurface.get('subsurfaces').removeObject(child);
  delete SC.subsurfaces[child.get('id')];
  return true;
}

function moveChild(composite, child) {
  if (removeChild(child) && insertChild(composite, child)) {
    SC.subsurfaces[child.get('id')] = child;
  }
}

function modifyTree() {
  var node, leaf, composite;
  // debugger;
  switch (Math.floor(Math.random()*11)) {
    case 0: // Add a leaf to an arbitrary composite surface
      composite = fetchComposite(null, false);
      leaf = SC.View.create();
      if (composite && leaf) insertChild(composite, leaf);
      break;
    case 1: // Add a composite to an arbitrary composite surface
      composite = fetchComposite(null, false);
      node = SC.ContainerSurface.create();
      if (composite && node) insertChild(composite, node);
      break;
    case 2: // Remove an arbitary leaf
      leaf = fetchLeaf();
      if (leaf) removeChild(leaf);
      break;
    case 3: // Remove an arbitrary composite w/o children
      composite = fetchComposite(null, false);
      if (composite) removeChild(composite);
      break;
    case 4: // Remove an arbitrary composite w/children
      composite = fetchComposite(null, true);
      if (composite) removeChild(composite);
      break;
    case 5: // Move an arbitrary leaf to another composite w/o children
      leaf = fetchLeaf();
      composite = fetchComposite(null, false);
      if (leaf && composite) moveChild(composite, leaf);
      break;
    case 6: // Move an arbitrary leaf to another composite w/ children
      leaf = fetchLeaf();
      composite = fetchComposite(null, true);
      if (leaf && composite) moveChild(composite, leaf);
      break;
    case 7: // Move an arbitary composite w/o children to another composite w/o children
      composite = fetchComposite(null, false);
      node = fetchComposite(composite, false);
      if (composite && node) moveChild(node, composite);
      break;
    case 8: // Move an arbitary composite w/o children to another composite w/children
      composite = fetchComposite(null, false);
      node = fetchComposite(composite, true);
      if (composite && node) moveChild(node, composite);
      break;
    case 9: // Move an arbitary composite w/ children to another composite w/o children
      composite = fetchComposite(null, true);
      node = fetchComposite(composite, false);
      if (composite && node) moveChild(node, composite);
      break;
    case 10: // Move an arbitary composite w/ children to another composite w/children
      composite = fetchComposite(null, true);
      node = fetchComposite(composite, true);
      if (composite && node) moveChild(node, composite);
      break;
  }
}

function main() {
  SC.Application.create(); // Assigns itself automatically to SC.app
  SC.app.set('ui', surface);
  SC.app.addSurface(tree);
}
