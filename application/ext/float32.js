// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals ArrayBuffer Float32Array sc_assert */

// offset is in floats, numElements is in floats
var sc_assert_valid_float32_buffer = function(buffer, offset, numElements) {
  var bytesNeeded = numElements*Float32Array.BYTES_PER_ELEMENT,
      offsetInBytes = offset*Float32Array.BYTES_PER_ELEMENT;

  sc_assert(buffer && buffer.constructor === ArrayBuffer);
  sc_assert(buffer.byteLength-offsetInBytes >= bytesNeeded);
};

SC.MakeFloat32ArrayBuffer = function(floatCount) {
  return new ArrayBuffer(floatCount*Float32Array.BYTES_PER_ELEMENT);
};

// ..........................................................
// 2D Points
//

SC.MakePoint = function(point, y) {
  var ret, x = point;

  if (arguments.length === 2) {
    ret = new Float32Array(2);     // initialize from function arguments
    ret[0] = x;
    ret[1] = y;

  } else if (point) {
    sc_assert(point.length === 2 && point.constructor === Float32Array);
    ret = new Float32Array(point); // initialize with existing point

  } else {
    ret = new Float32Array(2);     // zero-initialized
  }

  return ret;
};

SC.ZERO_POINT = SC.MakePoint();

SC.PointApplyAffineTransformTo = function(point, transform, dest) {
  var x = point[0], y = point[1];
  dest[0]/*x*/ = x * transform[0]/*m11*/ + y * transform[2]/*m21*/ + transform[4]/*tx*/;
  dest[1]/*y*/ = x * transform[1]/*m12*/ + y * transform[3]/*m22*/ + transform[5]/*ty*/;
};

// offset is in floats, not bytes
SC.MakePointFromBuffer = function(buffer, offset, point, y) {
  var ret, x = point;

  sc_assert_valid_float32_buffer(buffer, offset, 2);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  if (arguments.length === 4) {
    ret = new Float32Array(buffer, offset, 2); // initialize from function arguments
    ret[0] = x;
    ret[1] = y;

  } else if (point) {
    sc_assert(point.length === 2 && point.constructor === Float32Array);
    ret = new Float32Array(buffer, offset, 2);
    ret.set(point);                            // initialize with existing point

  } else {
    ret = new Float32Array(buffer, offset, 2);
    ret.set(SC.ZERO_POINT);                    // zero-initialize
  }

  sc_assert(ret.length === 2);
  return ret;
};

SC.IsPoint = function(point) {
  return (point.length === 2 && point.constructor === Float32Array);
};

// ..........................................................
// 3D Points
//

SC.MakePoint3D = function(point, y, z) {
  var ret, x = point;

  if (arguments.length === 3) {
    ret = new Float32Array(3);     // initialize from function arguments
    ret[0] = x;
    ret[1] = y;
    ret[2] = z;

  } else if (point) {
    sc_assert(point.length === 3 && point.constructor === Float32Array);
    ret = new Float32Array(point); // initialize with existing point

  } else {
    ret = new Float32Array(3);     // zero-initialized
  }

  return ret;
};

SC.ZERO_POINT_3D = SC.MakePoint3D();

SC.PointApplyTransform3DTo = function(point, transform, dest) {
  throw "not implemented";
  // var x = point[0], y = point[1];
  // dest[0]/*x*/ = x * transform[0]/*m11*/ + y * transform[2]/*m21*/ + transform[4]/*tx*/;
  // dest[1]/*y*/ = x * transform[1]/*m12*/ + y * transform[3]/*m22*/ + transform[5]/*ty*/;
};

// offset is in floats, not bytes
SC.MakePoint3DFromBuffer = function(buffer, offset, point, y, z) {
  var ret, x = point;

  sc_assert_valid_float32_buffer(buffer, offset, 2);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  if (arguments.length === 5) {
    ret = new Float32Array(buffer, offset, 3); // initialize from function arguments
    ret[0] = x;
    ret[1] = y;
    ret[2] = z;

  } else if (point) {
    sc_assert(point.length === 3 && point.constructor === Float32Array);
    ret = new Float32Array(buffer, offset, 3);
    ret.set(point);                            // initialize with existing point

  } else {
    ret = new Float32Array(buffer, offset, 3);
    ret.set(SC.ZERO_POINT_3D);                 // zero-initialize
  }

  sc_assert(ret.length === 3);
  return ret;
};

SC.IsPoint3D = function(point) {
  return (point.length === 3 && point.constructor === Float32Array);
};

// ..........................................................
// Sizes
//

SC.MakeSize = function(size, height) {
  var ret, width = size;

  if (arguments.length === 2) {
    ret = new Float32Array(2);     // initialize from function arguments
    ret[0] = width;
    ret[1] = height;

  } else if (size) {
    sc_assert(size.length === 2 && size.constructor === Float32Array);
    ret = new Float32Array(size); // initialize with existing size

  } else {
    ret = new Float32Array(2);    // zero-initialized
  }

  return ret;
};

SC.ZERO_SIZE = SC.MakeSize();

SC.SizeApplyAffineTransformTo = function(size, transform, dest) {
  sc_assert(size !== dest);
  dest[0]/*width*/  = size[0]/*width*/ * transform[0]/*m11*/ + size[1]/*height*/ * transform[2]/*m21*/;
  dest[1]/*height*/ = size[0]/*width*/ * transform[1]/*m12*/ + size[1]/*height*/ * transform[3]/*m22*/;
};

// offset is in floats, not bytes
SC.MakeSizeFromBuffer = function(buffer, offset, size, height) {
  var ret, width = size;

  sc_assert_valid_float32_buffer(buffer, offset, 2);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  if (arguments.length === 4) {
    ret = new Float32Array(buffer, offset, 2); // initialize from function arguments
    ret[0] = width;
    ret[1] = height;

  } else if (size) {
    sc_assert(size.length === 2 && size.constructor === Float32Array);
    ret = new Float32Array(buffer, offset, 2);
    ret.set(size);                             // initialize with existing size

  } else {
    ret = new Float32Array(buffer, offset, 2);
    ret.set(SC.ZERO_SIZE);                     // zero-initialize
  }

  sc_assert(ret.length === 2);
  return ret;
};

SC.IsSize = function(size) {
  return (size.length === 2 && size.constructor === Float32Array);
};

SC.EqualSize = function(size, size2) {
  sc_assert(size.length === 2 && size.constructor === Float32Array);
  sc_assert(size2.length === 2 && size2.constructor === Float32Array);

  if (size === size2) return true;
  else if (size[0] === size2[0] && size[1] === size2[1]) return true;
  else return false;
};

// ..........................................................
// Rects
//

SC.MakeRect = function(rect, y, width, height) {
  var ret, x = rect;

  if (arguments.length === 4) {
    ret = new Float32Array(4);     // initialize from function arguments
    ret[0] = x;
    ret[1] = y;
    ret[2] = width;
    ret[3] = height;

  } else if (rect) {
    sc_assert(rect.length === 4 && rect.constructor === Float32Array);
    ret = new Float32Array(rect); // initialize with existing rect

  } else {
    ret = new Float32Array(4);    // zero-initialized
  }

  return ret;
};

SC.ZERO_RECT = SC.MakeRect();

SC.RectApplyAffineTransformTo = function(rect, transform, dest) {
  sc_assert(rect !== dest);
  dest[0]/*x*/      = rect[0]/*x*/ * transform[0]/*m11*/ + rect[1]/*y*/ * transform[2]/*m21*/ + transform[4]/*tx*/;
  dest[1]/*y*/      = rect[0]/*x*/ * transform[1]/*m12*/ + rect[1]/*y*/ * transform[3]/*m22*/ + transform[5]/*ty*/;
  dest[2]/*width*/  = rect[2]/*width*/ * transform[0]/*m11*/ + rect[3]/*height*/ * transform[2]/*m21*/;
  dest[3]/*height*/ = rect[2]/*width*/ * transform[1]/*m12*/ + rect[3]/*height*/ * transform[3]/*m22*/;
};

// offset is in floats, not bytes
SC.MakeRectFromBuffer = function(buffer, offset, rect, y, width, height) {
  var ret, x = rect;

  sc_assert_valid_float32_buffer(buffer, offset, 4);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  if (arguments.length === 6) {
    ret = new Float32Array(buffer, offset, 4); // initialize from function arguments
    ret[0] = x;
    ret[1] = y;
    ret[2] = width;
    ret[3] = height;

  } else if (rect) {
    sc_assert(rect.length === 4 && rect.constructor === Float32Array);
    ret = new Float32Array(buffer, offset, 4);
    ret.set(rect);                             // initialize with existing rect

  } else {
    ret = new Float32Array(buffer, offset, 4);
    ret.set(SC.ZERO_RECT);                     // zero-initialize
  }

  sc_assert(ret.length === 4);
  return ret;
};

SC.ZERO_LAYOUT_VALUES = new Float32Array(8); // zero-initialized

// offset is in floats, not bytes
SC.MakeLayoutValuesFromBuffer = function(buffer, offset) {
  var ret;

  sc_assert_valid_float32_buffer(buffer, offset, 8);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  ret = new Float32Array(buffer, offset, 8);
  ret.set(SC.ZERO_LAYOUT_VALUES); // zero-initialize

  sc_assert(ret.length === 8);
  return ret;
};

SC.IsRect = function(rect) {
  return (rect.length === 4 && rect.constructor === Float32Array);
};

// ..........................................................
// Affine Transforms
//

SC.MakeAffineTransform = function(mat, m12,
                                  m21, m22,  tx, ty)
{
  var ret, m11 = mat;

  if (arguments.length === 6) {
    ret = new Float32Array(6);    // initialize from function arguments
    ret[0]  = m11; ret[1]  = m12;
    ret[2]  = m21; ret[3]  = m22;

    ret[4] = tx;
    ret[5] = ty;

  } else if (mat) {
    sc_assert(mat.length === 6 && mat.constructor === Float32Array);
    ret = new Float32Array(mat); // initialize with existing affine transform

  } else {
    ret = new Float32Array(6);   // zero-initialized
  }

  return ret;
};

SC.MakeIdentityAffineTransform = function() {
  var ret = new Float32Array(6);

  // A new Float32Array is already initialized to zero.
     ret[0]  = 1; /* ret[1]  = 0; */
  /* ret[2]  = 0; */ ret[3]  = 1;
  
  // ret[4] = 0;
  // ret[5] = 0;

  return ret;
};

SC.AFFINE_TRANSFORM_ZERO = SC.MakeAffineTransform();
SC.AFFINE_TRANSFORM_IDENTITY = SC.MakeIdentityAffineTransform();

// offset is in floats, not bytes
SC.MakeAffineTransformFromBuffer = function(buffer, offset, mat, m12,
                                                            m21, m22,  tx, ty)
{
  var ret, m11 = mat;

  sc_assert_valid_float32_buffer(buffer, offset, 6);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  if (arguments.length === 8) {
    ret = new Float32Array(buffer, offset); // initialize from function arguments
    ret[0]  = m11; ret[1]  = m12;
    ret[2]  = m21; ret[3]  = m22;

    ret[4] = tx;
    ret[5] = ty;

  } else if (mat) {
    sc_assert(mat.length === 6 && mat.constructor === Float32Array);
    ret = new Float32Array(buffer, offset, 6);
    ret.set(mat);                           // initialize with existing transform

  } else {
    ret = new Float32Array(buffer, offset, 6);
    ret.set(SC.AFFINE_TRANSFORM_ZERO);      // zero-initialize
  }

  sc_assert(ret.length === 6);
  return ret;
};

SC.MakeIdentityAffineTransformFromBuffer = function(buffer, offset) {
  var ret = SC.MakeAffineTransformFromBuffer(buffer, offset);
  ret.set(SC.AFFINE_TRANSFORM_IDENTITY);
  return ret;
};

SC.SetIdentityAffineTransform = function(mat) {
  sc_assert(mat && mat.length === 6 && mat.constructor === Float32Array);
  mat.set(SC.AFFINE_TRANSFORM_IDENTITY);
  // Result:
  //   mat[0]  = 1; mat[1] = 0;
  //   mat[2]  = 0; mat[5] = 1;
       
  //   mat[4] = 0;
  //   mat[5] = 0;
};

SC.AffineTransformConcatTo = function(left, right, dest) {
  var left_m11 = left[0]/*m11*/,
      left_m12 = left[1]/*m12*/,
      left_m21 = left[2]/*m21*/,
      left_m22 = left[3]/*m22*/,
      left_tx  = left[4]/*tx*/,
      left_ty  = left[5]/*ty*/;

  // Result:
  //   dest.m11 = left.m11 * right.m11 + left.m12 * right.m21;
  //   dest.m12 = left.m11 * right.m12 + left.m12 * right.m22;
  //   dest.m21 = left.m21 * right.m11 + left.m22 * right.m21;
  //   dest.m22 = left.m21 * right.m12 + left.m22 * right.m22;
  //   dest.tx = left.tx * right.m11 + left.ty * right.m21 + right.tx;
  //   dest.ty = left.tx * right.m12 + left.ty * right.m22 + right.ty;
  dest[0] = left_m11 * right[0] + left_m12 * right[2];
  dest[1] = left_m11 * right[1] + left_m12 * right[3];
  dest[2] = left_m21 * right[0] + left_m22 * right[2];
  dest[3] = left_m21 * right[1] + left_m22 * right[3];
  dest[4] = left_tx  * right[0] + left_tx  * right[2] + right[4];
  dest[5] = left_ty  * right[1] + left_ty  * right[3] + right[5];
};

SC.IsIdentityAffineTransform = function(mat) {
  if (mat[0]/*m11*/ === 1.0 &&
      mat[1]/*m12*/ === 0.0 &&
      mat[2]/*m21*/ === 0.0 &&
      mat[3]/*m22*/ === 1.0 &&
      mat[4]/*tx*/  === 0.0 &&
      mat[5]/*ty*/  === 0.0 ) return true;
  else return false;
};

// src and dest must be different!
SC.AffineTransformInvertTo = function(src, dest) {
  var determinant = 1 / (src[0]/*m11*/ * src[3]/*m22*/ - src[1]/*m12*/ * src[2]/*m21*/);

  sc_assert(src !== dest);

  dest[0]/*m11*/ =  determinant *  src[3]/*m22*/;
  dest[1]/*m12*/ = -determinant *  src[1]/*m12*/;
  dest[2]/*m21*/ = -determinant *  src[2]/*m21*/;
  dest[3]/*m22*/ =  determinant *  src[0]/*m11*/;
  dest[4]/*tx*/  =  determinant * (src[2]/*m21*/ * src[5]/*ty*/ - src[3]/*m22*/ * src[4]/*tx*/);
  dest[5]/*ty*/  =  determinant * (src[1]/*m12*/ * src[4]/*tx*/ - src[0]/*m11*/ * src[5]/*ty*/);
};

sc_assert(SC.IsIdentityAffineTransform(SC.AFFINE_TRANSFORM_IDENTITY));

// ..........................................................
// 3D Transforms
//

SC.MakeTransform3D = function(mat, m12, m13, m14,
                              m21, m22, m23, m24,
                              m31, m32, m33, m34,
                              m41, m42, m43, m44)
{
  var ret, m11 = mat;

  if (arguments.length === 16) {
    ret = new Float32Array(16);  // initialize from function arguments
    ret[0]  = m11; ret[1]  = m12; ret[2]  = m13; ret[3]  = m14;
    ret[4]  = m21; ret[5]  = m22; ret[6]  = m23; ret[7]  = m24;
    ret[8]  = m31; ret[9]  = m32; ret[10] = m33; ret[11] = m34;
    ret[12] = m41; ret[13] = m42; ret[14] = m43; ret[15] = m44;

  } else if (mat) {
    sc_assert(mat.length === 16 && mat.constructor === Float32Array);
    ret = new Float32Array(mat); // initialize with existing transform3d

  } else {
    ret = new Float32Array(16);  // zero-initialized
  }

  return ret;
};

SC.IsAffineTransform = function(mat) {
  return (mat.length === 6 && mat.constructor === Float32Array);
};

SC.CopyAffineTransformTo = function(src, dest) {
  sc_assert(src !== dest);
  sc_assert(src.length === 6 && src.constructor === Float32Array);
  sc_assert(dest.length === 6 && dest.constructor === Float32Array);

  dest.set(src);
};

SC.MakeIdentityTransform3D = function() {
  var ret = new Float32Array(16);

  // A new Float32Array is already initialized to zero.
     ret[0]  = 1; /* ret[1]  = 0;    ret[2]  = 0;    ret[3]  = 0; */
  /* ret[4]  = 0; */ ret[5]  = 1; /* ret[6]  = 0;    ret[7]  = 0; */
  /* ret[8]  = 0;    ret[9]  = 0; */ ret[10] = 1; /* ret[11] = 0; */
  /* ret[12] = 0;    ret[13] = 0;    ret[14] = 0; */ ret[15] = 1;

  return ret;
};

SC.TRANSFORM3D_ZERO = SC.MakeTransform3D();
SC.TRANSFORM3D_IDENTITY = SC.MakeIdentityTransform3D();

// offset is in floats, not bytes
SC.MakeTransform3DFromBuffer = function(buffer, offset, mat, m12, m13, m14,
                                                        m21, m22, m23, m24,
                                                        m31, m32, m33, m34,
                                                        m41, m42, m43, m44)
                                                        
{
  var ret, m11 = mat;

  sc_assert_valid_float32_buffer(buffer, offset, 16);
  offset = offset*Float32Array.BYTES_PER_ELEMENT;

  if (arguments.length === 18) {
    ret = new Float32Array(buffer, offset, 16); // initialize from function arguments
    ret[0]  = m11; ret[1]  = m12; ret[2]  = m13; ret[3]  = m14;
    ret[4]  = m21; ret[5]  = m22; ret[6]  = m23; ret[7]  = m24;
    ret[8]  = m31; ret[9]  = m32; ret[10] = m33; ret[11] = m34;
    ret[12] = m41; ret[13] = m42; ret[14] = m43; ret[15] = m44;

  } else if (mat) {
    sc_assert(mat.length === 16 && mat.constructor === Float32Array);
    ret = new Float32Array(buffer, offset, 16);
    ret.set(mat);                               // initialize with existing transform3d

  } else {
    ret = new Float32Array(buffer, offset, 16);
    ret.set(SC.TRANSFORM3D_ZERO);               // zero-initialize
  }

  sc_assert(ret.length === 16);
  return ret;
};

SC.MakeIdentityTransform3DFromBuffer = function(buffer, offset) {
  var ret = SC.MakeTransform3DFromBuffer(buffer, offset);
  ret.set(SC.TRANSFORM3D_IDENTITY);
  return ret;
};

SC.SetIdentityTransform3D = function(mat) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  mat.set(SC.TRANSFORM3D_IDENTITY);
  // Result:
  //   mat[0]  = 1; mat[1]  = 0; mat[2]  = 0; mat[3]  = 0;
  //   mat[4]  = 0; mat[5]  = 1; mat[6]  = 0; mat[7]  = 0;
  //   mat[8]  = 0; mat[9]  = 0; mat[10] = 1; mat[11] = 0;
  //   mat[12] = 0; mat[13] = 0; mat[14] = 0; mat[15] = 1;
};

SC.IsTransform3D = function(mat) {
  return (mat.length === 16 && mat.constructor === Float32Array);
};

SC.CopyTransform3DTo = function(src, dest) {
  sc_assert(src !== dest);
  sc_assert(src.length === 16 && src.constructor === Float32Array);
  sc_assert(dest.length === 16 && dest.constructor === Float32Array);

  dest.set(src);
};

SC.Transform3DConcatTo = function(left, right, dest) {
  var left_m11 = left[0] /*m11*/,
      left_m12 = left[1] /*m12*/,
      left_m13 = left[2] /*m13*/,
      left_m14 = left[3] /*m14*/,
      left_m21 = left[4] /*m21*/,
      left_m22 = left[5] /*m22*/,
      left_m23 = left[6] /*m23*/,
      left_m24 = left[7] /*m24*/,
      left_m31 = left[8] /*m31*/,
      left_m32 = left[9] /*m32*/,
      left_m33 = left[10]/*m33*/,
      left_m34 = left[11]/*m34*/,
      left_m41 = left[12]/*m41*/,
      left_m42 = left[13]/*m42*/,
      left_m43 = left[14]/*m43*/,
      left_m44 = left[15]/*m44*/;

  // Result:
  //   dest.m11 = left.m11 * right.m11 + left.m12 * right.m21 + left.m13 * right.m31 + left.m14 * right.m41;
  //   dest.m12 = left.m11 * right.m12 + left.m12 * right.m22 + left.m13 * right.m32 + left.m14 * right.m42;
  //   dest.m13 = left.m11 * right.m13 + left.m12 * right.m23 + left.m13 * right.m33 + left.m14 * right.m43;
  //   dest.m14 = left.m11 * right.m14 + left.m12 * right.m24 + left.m13 * right.m34 + left.m14 * right.m44;
  
  //   dest.m21 = left.m21 * right.m11 + left.m22 * right.m21 + left.m23 * right.m31 + left.m24 * right.m41;
  //   dest.m22 = left.m21 * right.m12 + left.m22 * right.m22 + left.m23 * right.m32 + left.m24 * right.m42;
  //   dest.m23 = left.m21 * right.m13 + left.m22 * right.m23 + left.m23 * right.m33 + left.m24 * right.m43;
  //   dest.m24 = left.m21 * right.m14 + left.m22 * right.m24 + left.m23 * right.m34 + left.m24 * right.m44;

  //   dest.m31 = left.m31 * right.m11 + left.m32 * right.m21 + left.m33 * right.m31 + left.m34 * right.m41;
  //   dest.m32 = left.m31 * right.m12 + left.m32 * right.m22 + left.m33 * right.m32 + left.m34 * right.m42;
  //   dest.m33 = left.m31 * right.m13 + left.m32 * right.m23 + left.m33 * right.m33 + left.m34 * right.m43;
  //   dest.m34 = left.m31 * right.m14 + left.m32 * right.m24 + left.m33 * right.m34 + left.m34 * right.m44;

  //   dest.m41 = left.m41 * right.m11 + left.m42 * right.m21 + left.m43 * right.m31 + left.m44 * right.m41;
  //   dest.m42 = left.m41 * right.m12 + left.m42 * right.m22 + left.m43 * right.m32 + left.m44 * right.m42;
  //   dest.m43 = left.m41 * right.m13 + left.m42 * right.m23 + left.m43 * right.m33 + left.m44 * right.m43;
  //   dest.m44 = left.m41 * right.m14 + left.m42 * right.m24 + left.m43 * right.m34 + left.m44 * right.m44;

  dest[0]  = left_m11 * right[0] + left_m12 * right[4] + left_m13 * right[8]  + left_m14 * right[12];
  dest[1]  = left_m11 * right[1] + left_m12 * right[5] + left_m13 * right[9]  + left_m14 * right[13];
  dest[2]  = left_m11 * right[2] + left_m12 * right[6] + left_m13 * right[10] + left_m14 * right[14];
  dest[3]  = left_m11 * right[3] + left_m12 * right[7] + left_m13 * right[11] + left_m14 * right[15];

  dest[4]  = left_m21 * right[0] + left_m22 * right[4] + left_m23 * right[8]  + left_m24 * right[12];
  dest[5]  = left_m21 * right[1] + left_m22 * right[5] + left_m23 * right[9]  + left_m24 * right[13];
  dest[6]  = left_m21 * right[2] + left_m22 * right[6] + left_m23 * right[10] + left_m24 * right[14];
  dest[7]  = left_m21 * right[3] + left_m22 * right[7] + left_m23 * right[11] + left_m24 * right[15];

  dest[8]  = left_m31 * right[0] + left_m32 * right[4] + left_m33 * right[8]  + left_m34 * right[12];
  dest[9]  = left_m31 * right[1] + left_m32 * right[5] + left_m33 * right[9]  + left_m34 * right[13];
  dest[10] = left_m31 * right[2] + left_m32 * right[6] + left_m33 * right[10] + left_m34 * right[14];
  dest[11] = left_m31 * right[3] + left_m32 * right[7] + left_m33 * right[11] + left_m34 * right[15];

  dest[12] = left_m41 * right[0] + left_m42 * right[4] + left_m43 * right[8]  + left_m44 * right[12];
  dest[13] = left_m41 * right[1] + left_m42 * right[5] + left_m43 * right[9]  + left_m44 * right[13];
  dest[14] = left_m41 * right[2] + left_m42 * right[6] + left_m43 * right[10] + left_m44 * right[14];
  dest[15] = left_m41 * right[3] + left_m42 * right[7] + left_m43 * right[11] + left_m44 * right[15];
};

SC.temporaryTransform3D = SC.MakeIdentityTransform3D();

// ..........................................................
// 3D Transforms - Rotation
//

SC.Transform3DRotateXTo = function(src, rad, dst) {
  sc_assert(src && src.length === 16 && src.constructor === Float32Array);
  sc_assert(dst && dst.length === 16 && dst.constructor === Float32Array);
  sc_assert(typeof rad === 'number');

  var tmp = SC.temporaryTransform3D;
  tmp.set(SC.TRANSFORM3D_IDENTITY); // Bulk set the 1s and 0s

  var cos = Math.cos(rad);

  // tmp[0]  =  1;   tmp[1]  = 0            ; tmp[2]  = 0             ;    tmp[3]  = 0;
  /* tmp[4]  =  0;*/ tmp[5]  = cos          ; tmp[6]  = Math.sin(-rad); // tmp[7]  = 0;
  /* tmp[8]  =  0;*/ tmp[9]  = Math.sin(rad); tmp[10] = cos           ; // tmp[11] = 0;
  // tmp[12] =  0;   tmp[13] = 0            ; tmp[14] = 0             ;    tmp[15] = 1;

  SC.Transform3DConcatTo(src, tmp, dst);
};

SC.Transform3DRotateYTo = function(src, rad, dst) {
  sc_assert(src && src.length === 16 && src.constructor === Float32Array);
  sc_assert(dst && dst.length === 16 && dst.constructor === Float32Array);
  sc_assert(typeof rad === 'number');

  var tmp = SC.temporaryTransform3D;
  tmp.set(SC.TRANSFORM3D_IDENTITY); // Bulk set the 1s and 0s

  var cos = Math.cos(rad);

     tmp[0]  = cos           ; /*tmp[1]  = 0;*/ tmp[2]  = Math.sin(rad); // tmp[3]  = 0;
  // tmp[4]  = 0             ;   tmp[5]  = 1;   tmp[6]  = 0            ;    tmp[7]  = 0;
     tmp[8]  = Math.sin(-rad); /*tmp[9]  = 0;*/ tmp[10] = cos          ; // tmp[11] = 0;
  // tmp[12] = 0             ;   tmp[13] = 0;   tmp[14] = 0            ;    tmp[15] = 1;

  SC.Transform3DConcatTo(src, tmp, dst);
};

SC.Transform3DRotateZTo = function(src, rad, dst) {
  sc_assert(src && src.length === 16 && src.constructor === Float32Array);
  sc_assert(dst && dst.length === 16 && dst.constructor === Float32Array);
  sc_assert(typeof rad === 'number');

  var tmp = SC.temporaryTransform3D;
  tmp.set(SC.TRANSFORM3D_IDENTITY); // Bulk set the 1s and 0s

  var cos = Math.cos(rad);

     tmp[0]  =  cos          ; tmp[1]  = Math.sin(-rad); // tmp[2]  = 0; tmp[3]  = 0;
     tmp[4]  =  Math.sin(rad); tmp[5]  = cos           ; // tmp[6]  = 0; tmp[7]  = 0;
  // tmp[8]  =  0            ; tmp[9]  = 0             ;    tmp[10] = 1; tmp[11] = 0;
  // tmp[12] =  0            ; tmp[13] = 0             ;    tmp[14] = 0; tmp[15] = 1;

  SC.Transform3DConcatTo(src, tmp, dst);
};

SC.Transform3DRotateX = function(mat, rad) {
  var ret = SC.MakeTransform3D();
  SC.Transform3DRotateXTo(mat, rad, ret);
  return ret;
};

SC.Transform3DRotateY = function(mat, rad) {
  var ret = SC.MakeTransform3D();
  SC.Transform3DRotateYTo(mat, rad, ret);
  return ret;
};

SC.Transform3DRotateZ = function(mat, rad) {
  var ret = SC.MakeTransform3D();
  SC.Transform3DRotateZTo(mat, rad, ret);
  return ret;
};

// ..........................................................
// 3D Transforms - Scaling
//

SC.Transform3DScaleX = function(mat, x) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[0] *= x;
  return ret;
};

SC.Transform3DScaleY = function(mat, y) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof y === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[5] *= y;
  return ret;
};

SC.Transform3DScaleZ = function(mat, z) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof z === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[10] *= z;
  return ret;
};

SC.Transform3DScale = function(mat, x, y) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  sc_assert(typeof y === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[0]  *= x;
  ret[5]  *= y;
  return ret;
};

SC.Transform3DScale3D = function(mat, x, y, z) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  sc_assert(typeof y === 'number');
  sc_assert(typeof z === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[0]   *= x;
  ret[5]   *= y;
  ret[10]  *= y;
  return ret;
};

SC.Transform3DScale3DTo = function(src, x, y, z, dst) {
  sc_assert(src && src.length === 16 && src.constructor === Float32Array);
  sc_assert(dst && dst.length === 16 && dst.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  sc_assert(typeof y === 'number');
  sc_assert(typeof z === 'number');

  if (src !== dst) dst.set(src); // Bulk set

  // And then just update the value in-place.
  dst[0]  *= x;
  dst[5]  *= y;
  dst[10] *= z;
};

// ..........................................................
// 3D Transforms - Translation
//

SC.Transform3DTranslateX = function(mat, x) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[12] += x;
  return ret;
};

SC.Transform3DTranslateY = function(mat, y) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof y === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[13] += y;
  return ret;
};

SC.Transform3DTranslateZ = function(mat, z) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof z === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[14] += z;
  return ret;
};

SC.Transform3DTranslate = function(mat, x, y) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  sc_assert(typeof y === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[12] += x;
  ret[13] += y;
  return ret;
};

SC.Transform3DTranslate3D = function(mat, x, y, z) {
  sc_assert(mat && mat.length === 16 && mat.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  sc_assert(typeof y === 'number');
  sc_assert(typeof z === 'number');
  var ret = SC.MakeTransform3D(mat);
  ret[12] += x;
  ret[13] += y;
  ret[14] += z;
  return ret;
};

SC.Transform3DTranslate3DTo = function(src, x, y, z, dst) {
  sc_assert(src && src.length === 16 && src.constructor === Float32Array);
  sc_assert(dst && dst.length === 16 && dst.constructor === Float32Array);
  sc_assert(typeof x === 'number');
  sc_assert(typeof y === 'number');
  sc_assert(typeof z === 'number');

  if (src !== dst) dst.set(src); // Bulk set

  // And then just update the value in-place.
  dst[12] += x;
  dst[13] += y;
  dst[14] += z;
};

// ..........................................................
// Structure Getters and Setters
//

// Below are ways to access these structures using names, rather than
// indices. They are designed to match the equivalent structure in Cocoa/
// Core Animation.
//
// Note that it is more efficient to index into them, so Blossom's own code 
// should always use the indices, not the getter/setters.

Float32Array.prototype.__defineGetter__('x', function() {
  return this[0];
});

Float32Array.prototype.__defineSetter__('x', function(val) {
  var old = this[0];
  this[0] = val;
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'x', old, val);
});

Float32Array.prototype.__defineGetter__('y', function() {
  return this[1];
});

Float32Array.prototype.__defineSetter__('y', function(val) {
  var old = this[1];
  this[1] = val;
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'y', old, val);
});

Float32Array.prototype.__defineGetter__('z', function() {
  return this[2];
});

Float32Array.prototype.__defineSetter__('z', function(val) {
  var old = this[2];
  this[2] = val;
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'z', old, val);
});

Float32Array.prototype.__defineGetter__('w', function() {
  return this.length === 2 ? this[0] : this[2];
});

Float32Array.prototype.__defineSetter__('w', function(val) {
  var old;
  if (this.length === 2) {
    old = this[0];
    this[0] = val;
  } else {
    old = this[2];
    this[2] = val;
  }
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'width', old, val);
});

Float32Array.prototype.__defineGetter__('width', function() {
  return this.length === 2 ? this[0] : this[2];
});

Float32Array.prototype.__defineSetter__('width', function(val) {
  var old;
  if (this.length === 2) {
    old = this[0];
    this[0] = val;
  } else {
    old = this[2];
    this[2] = val;
  }
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'width', old, val);
});

Float32Array.prototype.__defineGetter__('h', function() {
  return this.length === 2 ? this[1] : this[3];
});

Float32Array.prototype.__defineSetter__('h', function(val) {
  var old;
  if (this.length === 2) {
    old = this[1];
    this[1] = val;
  } else {
    old = this[3];
    this[3] = val;
  }
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'height', old, val);
});

Float32Array.prototype.__defineGetter__('height', function() {
  return this.length === 2 ? this[1] : this[3];
});

Float32Array.prototype.__defineSetter__('height', function(val) {
  var old;
  if (this.length === 2) {
    old = this[1];
    this[1] = val;
  } else {
    old = this[3];
    this[3] = val;
  }
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'height', old, val);
});

// Allow structure access to SC.AffineTransform and SC.Transform3D members.
'm11 m12 m13 m14 m21 m22 m23 m24 m31 m32 m33 m34 m41 m42 m43 m44'.w().forEach(function(prop, idx) {

  // The m21 and m22 props are defined below, but we leave them in here
  // so the indexing for subsquent properties is correct.
  if (prop === 'm21' || prop === 'm22') return;

  Float32Array.prototype.__defineGetter__(prop, function() {
    return this[idx];
  });

  Float32Array.prototype.__defineSetter__(prop, function(val) {
    var old = this[idx];
    this[idx] = val;
    var owner = this.owner;
    if (owner) owner.structureDidChange(this, this.keyName, prop, old, val);
  });

});

// The m21 and m22 members have different indices depending on array length.
Float32Array.prototype.__defineGetter__('m21', function() {
  return (this.length === 6) ? this[2] : this[4];
});

Float32Array.prototype.__defineSetter__('m21', function(val) {
  var old;
  if (this.length === 6) {
    old = this[2];
    this[2] = val;
  } else {
    old = this[4];
    this[4] = val;
  }
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'm21', old, val);
});

Float32Array.prototype.__defineGetter__('m22', function() {
  return (this.length === 6) ? this[3] : this[5];
});

Float32Array.prototype.__defineSetter__('m22', function(val) {
  var old;
  if (this.length === 6) {
    old = this[3];
    this[3] = val;
  } else {
    old = this[5];
    this[5] = val;
  }
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'm22', old, val);
});

Float32Array.prototype.__defineGetter__('tx', function() {
  return this[4];
});

Float32Array.prototype.__defineSetter__('tx', function(val) {
  var old = this[4];
  this[4] = val;
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'tx', old, val);
});

Float32Array.prototype.__defineGetter__('ty', function() {
  return this[5];
});

Float32Array.prototype.__defineSetter__('ty', function(val) {
  var old = this[5];
  this[5] = val;
  var owner = this.owner;
  if (owner) owner.structureDidChange(this, this.keyName, 'ty', old, val);
});
