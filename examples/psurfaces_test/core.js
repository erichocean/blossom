/*globals base3 green sc_assert */

var tree = SC.ContainerSurface.create();

var container = null;

var log = null;

function validatePsurfaces() {
  var ary = Object.keys(SC.surfaces),
      length = ary.length;

  // First make sure that we don't have any dangling surfaces.
  ary.forEach(function(key) {
    var surface = SC.surfaces[key];
    if (surface === tree || surface === surface || surface === container) return;
    else sc_assert(surface.get('supersurface'));
  });

  // Now validate the tree. Exactly one psurface should exist for each 
  // surface in the tree, the parent-child relationships should match, and 
  // the psurfaces's element should be the element with the same id in the 
  // DOM, and have the same parent-child relationship.
  // 
  // Note: this does not validate the ordering of psurfaces and DOM elements.
  (function validateChildren(parent) {
    var pid = parent.get('id'), psurface, pelement;
    psurface = SC.psurfaces[pid];
    sc_assert(psurface);
    sc_assert(psurface.id === pid);
    pelement = document.getElementById(pid);
    sc_assert(pelement);
    sc_assert(psurface.__element__ === pelement);

    var subsurfaces = parent.get('subsurfaces');
    if (!subsurfaces) return;
    else {
      subsurfaces.forEach(function(surface) {
        sc_assert(surface.get('supersurface') === parent);

        var id = surface.get('id'),
            element = document.getElementById(id);
        sc_assert(element.parentElement === pelement);
      });
      subsurfaces.forEach(validateChildren);
    }
  })(tree);

  // At this point, the psurfaces tree and DOM tree have the same nodes and 
  // parent-child relationships, but siblings may not be in the correct order.
  // To test this, we walk the surfaces tree in order, issuing the correct 
  // commands as we do to also walk the psurface and element trees in order.
  var psurface, element, nextPsurface, nextElement;

  function push(surface) {
    nextPsurface = SC.psurfaces[surface.get('id')];
    nextElement = document.getElementById(surface.get('id'));
    sc_assert(psurface.firstChild === nextPsurface);
    sc_assert(element.firstElementChild === nextElement);
    sc_assert(!nextPsurface.prevSibling);
    sc_assert(!nextElement.previousElementSibling);
    psurface = nextPsurface;
    element = nextElement;
  }

  function next(surface) {
    nextPsurface = SC.psurfaces[surface.get('id')];
    nextElement = document.getElementById(surface.get('id'));
    sc_assert(psurface.nextSibling === nextPsurface);
    sc_assert(psurface === nextPsurface.prevSibling);
    sc_assert(element.nextElementSibling === nextElement);
    sc_assert(element === nextElement.previousElementSibling);
    psurface = nextPsurface;
    element = nextElement;
  }

  function pop() {
    sc_assert(!psurface.nextSibling);
    sc_assert(!element.nextElementSibling);
    psurface = psurface.parent;
    element = element.parentNode;
  }

  psurface = SC.psurfaces[tree.get('id')];
  element = document.getElementById(tree.get('id'));

  (function visitSubsurfaces(parent) {
    var subsurfaces = parent.get('subsurfaces'), cur;
    if (subsurfaces && subsurfaces.get('length') > 0) {
      subsurfaces.forEach(function(surface, idx) {
        if (idx === 0) push(surface);
        else next(surface);

        visitSubsurfaces(surface);
      });
      pop();
    }
  })(tree);
}

var timeout;

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
    clearTimeout(timeout);
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
  var ret = leaf.isLeafSurface? leaf : null;
  if (ret && ret === surface) ret = null;
  if (ret) sc_assert(leaf.get('supersurface'));
  return ret;
}

function childIsInParent(parent, child) {
  if (parent === child) return true; // Abort.

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

  if (found && composite === container) found = false;
  if (found && composite !== tree) sc_assert(composite.get('supersurface'));
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
  delete SC.surfaces[child.get('id')];
  return true;
}

function moveChild(composite, child) {
  if (removeChild(child) && insertChild(composite, child)) {
    SC.surfaces[child.get('id')] = child;
  }
}

function modifyTree() {
  var node, leaf, composite;
  // debugger;
  switch (Math.floor(Math.random()*11)) {
    case 0:
       composite = fetchComposite(null, false);
      if (composite) {
        leaf = SC.View.create();
        log.push("Add a new leaf (%@) to an arbitrary composite surface (%@).".fmt(leaf.get('id'), composite.get('id')));
        insertChild(composite, leaf);
      }
      break;
    case 1:
      composite = fetchComposite(null, false);
      if (composite) {
        node = SC.ContainerSurface.create();
        log.push("Add a new composite (%@) to an arbitrary composite surface (%@).".fmt(node.get('id'), composite.get('id')));
        insertChild(composite, node);
      }
      break;
    case 2:
      leaf = fetchLeaf();
      if (leaf) {
        log.push("Remove an arbitrary leaf (%@).".fmt(leaf.get('id')));
        removeChild(leaf);
      }
      break;
    case 3:
      composite = fetchComposite(null, false);
      if (composite) {
        log.push("// Remove an arbitrary composite w/o children (%@).".fmt(composite.get('id')));
        removeChild(composite);
      }
      break;
    case 4:
      composite = fetchComposite(null, true);
      if (composite) {
        log.push("Remove an arbitrary composite w/children (%@).".fmt(composite.get('id')));
        removeChild(composite);
      }
      break;
    case 5:
      leaf = fetchLeaf();
      composite = fetchComposite(null, false);
      if (leaf && composite) {
        log.push("Move an arbitrary leaf (%@) to another composite w/o children (%@).".fmt(leaf.get('id'), composite.get('id')));
        moveChild(composite, leaf);
      }
      break;
    case 6:
      leaf = fetchLeaf();
      composite = fetchComposite(null, true);
      if (leaf && composite) {
        log.push("Move an arbitrary leaf (%@) to another composite w/ children (%@).".fmt(leaf.get('id'), composite.get('id')));
        moveChild(composite, leaf);
      }
      break;
    case 7:
      composite = fetchComposite(null, false);
      node = fetchComposite(composite, false);
      if (composite && node) {
        log.push("Move an arbitrary composite w/o children (%@) to another composite w/o children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 8:
      composite = fetchComposite(null, false);
      node = fetchComposite(composite, true);
      if (composite && node) {
        log.push("Move an arbitrary composite w/o children (%@) to another composite w/children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 9:
      composite = fetchComposite(null, true);
      node = fetchComposite(composite, false);
      if (composite && node) {
        log.push("Move an arbitrary composite w/ children (%@) to another composite w/o children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 10:
      composite = fetchComposite(null, true);
      node = fetchComposite(composite, true);
      if (composite && node) {
        log.push("Move an arbitary composite w/ children (%@) to another composite w/children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
  }
}

function test() {
  log = [];
  var times = Math.floor(Math.random()*6); // up to 5 modifications
  while (times === 0) times = Math.floor(Math.random()*6);

  // Make up to five tree modifications.
  while (times--) modifyTree();

  try {
    // Update the Psurfaces tree manually (this is the code we are fuzz testing).
    tree.updatePsurfaceTree();
  } catch (e) {
    console.log(e);
    console.log(log.join('\n'));
  }

  // Validate the Psurfaces tree, and the DOM.
  validatePsurfaces();
  timeout = setTimeout(test, 0);
}

function main() {
  SC.Application.create(); // Assigns itself automatically to SC.app
  SC.app.set('ui', surface);
  container = SC.app.get('uiContainer');
  SC.app.addSurface(tree);
  timeout = setTimeout(test, 0);
}
