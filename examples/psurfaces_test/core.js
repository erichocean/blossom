/*globals base3 green blue sc_assert */

var tree = SC.ContainerSurface.create();

var uiContainer = null;

var log = null;

var timeout;

var tests = 0;

var surface = SC.View.create({

  updateDisplay: function() {
    console.log('updateDisplay');
    // var ctx = this.getPath('layer.context');

    var psurface = SC.psurfaces[this.__id__],
        canvas = psurface? psurface.__element__ : null,
        ctx = canvas? canvas.getContext('2d') : null,
        w = canvas.width, h = canvas.height;

    if (!ctx) return;

    // Draw background.
    ctx.fillStyle = base3;
    ctx.fillRect(0, 0, w, h);

    // Draw text.
    ctx.fillStyle = green;
    ctx.font = "16pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Welcome to the SC.Psurface fuzz tester.", w/2, (h/2)-180);
    ctx.fillText("The surface tree is being repeatedly modified, and then", w/2, (h/2)-100);
    ctx.fillText("the corresponding Psurface and rendering tree (DOM) is", w/2, (h/2)-60);
    ctx.fillText("being updated and exhaustively verified for correctness.", w/2, (h/2)-20);
    ctx.fillText("Click anywhere to end the fuzz test.", w/2, (h/2)+60);

    ctx.fillStyle = blue;
    ctx.fillText("Completed "+tests+" tests.", w/2, (h/2)+205);
  },

  mouseDown: function() {
    clearTimeout(timeout);
  }

});

function validatePsurfaces() {
  var ary = Object.keys(SC.surfaces),
      ary2 = Object.keys(SC.psurfaces),
      length = ary.length;

  // First make sure that we don't have any dangling surfaces.
  ary.forEach(function(key) {
    var s = SC.surfaces[key];
    if (s === tree || s === surface || s === uiContainer) return;
    else sc_assert(s.get('supersurface'));
  });

  // Then verify that there is exactly one psurface for each surface.
  ary.sort();
  ary2.sort();

  // Lengths should be the same.
  sc_assert(ary.length === ary2.length);

  // Keys should be the same.
  ary.forEach(function(key, idx) {
    sc_assert(key === ary2[idx]);
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

        sc_assert(element);
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

function fetchLeaf() {
  var ary = Object.keys(SC.surfaces),
      length = ary.length,
      idx = Math.floor(Math.random()*length),
      tries = 0, leaf;

  // console.log(ary);
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

  if (found && composite === uiContainer) found = false;
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

  return true;
}

function moveChild(composite, child) {
  if (removeChild(child)) insertChild(composite, child);
}

function modifyTree() {
  var node, leaf, composite;
  // debugger;
  var weight = Math.floor(Math.random()*13); // Max 12
  weight = Math.floor(Math.random()*weight); // Max 11
  switch (Math.floor(Math.random()*weight)) {
    case 0:
      composite = fetchComposite(null, false);
      if (composite) {
        leaf = SC.LeafSurface.create();
        log.push("Add a new leaf (%@) to an arbitrary composite surface (%@).".fmt(leaf.get('id'), composite.get('id')));
        insertChild(composite, leaf);
      }
      break;
    case 1:
      composite = fetchComposite(null, false);
      if (composite) {
        node = SC.CompositeSurface.create();
        log.push("Add a new composite (%@) to an arbitrary composite surface (%@).".fmt(node.get('id'), composite.get('id')));
        insertChild(composite, node);
      }
      break;
    case 2:
      leaf = fetchLeaf();
      composite = fetchComposite(null, false);
      if (leaf && composite) {
        log.push("Move an arbitrary leaf (%@) to another composite w/o children (%@).".fmt(leaf.get('id'), composite.get('id')));
        moveChild(composite, leaf);
      }
      break;
    case 3:
      leaf = fetchLeaf();
      composite = fetchComposite(null, true);
      if (leaf && composite) {
        log.push("Move an arbitrary leaf (%@) to another composite w/ children (%@).".fmt(leaf.get('id'), composite.get('id')));
        moveChild(composite, leaf);
      }
      break;
    case 4:
      composite = fetchComposite(null, false);
      node = fetchComposite(composite, false);
      if (composite && node) {
        log.push("Move an arbitrary composite w/o children (%@) to another composite w/o children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 5:
      composite = fetchComposite(null, false);
      node = fetchComposite(composite, true);
      if (composite && node) {
        log.push("Move an arbitrary composite w/o children (%@) to another composite w/children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 6:
      composite = fetchComposite(null, true);
      node = fetchComposite(composite, false);
      if (composite && node) {
        log.push("Move an arbitrary composite w/ children (%@) to another composite w/o children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 7:
      composite = fetchComposite(null, true);
      node = fetchComposite(composite, true);
      if (composite && node) {
        log.push("Move an arbitary composite w/ children (%@) to another composite w/children (%@).".fmt(composite.get('id'), node.get('id')));
        moveChild(node, composite);
      }
      break;
    case 8:
      leaf = fetchLeaf();
      if (leaf) {
        log.push("Remove an arbitrary leaf (%@).".fmt(leaf.get('id')));
        removeChild(leaf);
      }
      break;
    case 9:
      composite = fetchComposite(null, false);
      if (composite) {
        log.push("Remove an arbitrary composite w/o children (%@).".fmt(composite.get('id')));
        removeChild(composite);
      }
      break;
    case 10:
      composite = fetchComposite(null, true);
      if (composite) {
        log.push("Remove an arbitrary composite w/children (%@).".fmt(composite.get('id')));
        removeChild(composite);
      }
      break;
  }
}

function spaces(depth) {
  var ret = "", idx, len;
  for (idx = 0, len = depth; idx<len; ++idx) ret += "  ";
  return ret;
}

function printTree(parent, depth) {
  depth = depth === undefined? 0 : depth;
  console.log(spaces(depth)+parent.get('id')+' ('+(parent.isCompositeSurface? 'composite':'leaf')+')');
  depth++;
  var subsurfaces = parent.get('subsurfaces');
  if (subsurfaces) {
    subsurfaces.forEach(function(surface) {
      printTree(surface, depth);
    });
  }
}

var modificationsPerTest = 6;

function test() {
  SC.RunLoop.begin();
  tests++;
  log = [];
  var times = Math.floor(Math.random()*modificationsPerTest);
  while (times === 0) times = Math.floor(Math.random()*modificationsPerTest);

  // printTree(tree);

  // Make up to five tree modifications.
  while (times--) modifyTree();

  try {
    var surfaces = null;
    if (SC.surfacesHashNeedsUpdate) {
      SC.surfacesHashNeedsUpdate = false;
      SC.surfaces = surfaces = {};
    }

    // Update the Psurfaces tree manually (this is the code we are fuzz testing).
    uiContainer.updatePsurfaceTree(surfaces);
    tree.updatePsurfaceTree(surfaces);
  } catch (e) {
    console.log(e);
    console.log(log.join('\n'));
  }

  // Validate the Psurfaces tree, and the DOM.
  validatePsurfaces();

  surface.triggerRendering();

  timeout = setTimeout(test, 0);
  SC.RunLoop.end();
}

function main() {
  SC.Application.create(); // Assigns itself automatically to SC.app
  SC.app.set('ui', surface);
  uiContainer = SC.app.get('uiContainer');
  SC.app.addSurface(tree);
  timeout = setTimeout(test, 0);
}
