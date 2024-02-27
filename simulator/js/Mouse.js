class Mouse {
  static CLICK_EXTENT_LINE = 10;
  static CLICK_EXTENT_POINT = 10;
  static TOUCHSCREEN_EXTENT_RATIO = 2;
  static SNAP_TO_DIRECTION_LOCK_LIMIT = 30;

  /**
   * @param {geometry.point} pos - The position of the mouse within the scene.
   * @param {Scene} scene - The scene in which the mouse operates.
   * @param {boolean} isTouch - Indicates whether the mouse input comes from a touch screen.
   */
  constructor(pos, scene, isTouch) {
    this.pos = pos;
    this.scene = scene;
    this.isTouch = isTouch;
  }

  /**
   * Calculates the effective click extent based on whether the target is a point or a line,
   * and adjusts for touchscreen input if applicable.
   * @param {boolean} isPoint - Specifies whether the target is a point (true) or a line (false).
   * @returns {number} The calculated click extent.
   */
  getClickExtent(isPoint) {
    let clickExtent;
    if (isPoint) {
      clickExtent = Mouse.CLICK_EXTENT_POINT / this.scene.scale;
    } else {
      clickExtent = Mouse.CLICK_EXTENT_LINE / this.scene.scale;
    }
    if (this.isTouch) {
      clickExtent *= Mouse.TOUCHSCREEN_EXTENT_RATIO;
    }
    return clickExtent;
  }

  /**
   * Determines if the mouse is currently over a given point.
   * @param {geometry.point} point - The point to check against the mouse position.
   * @returns {boolean} True if the mouse is on the given point, false otherwise.
   */
  isOnPoint(point) {
    return geometry.length_squared(this.pos, point) < this.getClickExtent(true) * this.getClickExtent(true);
  }

  /**
   * Determines if the mouse is currently over a given line segment.
   * @param {geometry.segment} segment - The line segment to check against the mouse position.
   * @returns {boolean} True if the mouse is on the given line segment, false otherwise.
   */
  isOnSegment(segment) {
    var d_per = Math.pow((this.pos.x - segment.p1.x) * (segment.p1.y - segment.p2.y) + (this.pos.y - segment.p1.y) * (segment.p2.x - segment.p1.x), 2) / ((segment.p1.y - segment.p2.y) * (segment.p1.y - segment.p2.y) + (segment.p2.x - segment.p1.x) * (segment.p2.x - segment.p1.x)); // Similar to the distance between the mouse and the line
    var d_par = (segment.p2.x - segment.p1.x) * (this.pos.x - segment.p1.x) + (segment.p2.y - segment.p1.y) * (this.pos.y - segment.p1.y); // Similar to the projected point of the mouse on the line
    return d_per < this.getClickExtent() * this.getClickExtent() && d_par >= 0 && d_par <= geometry.length_segment_squared(segment);
  }

  /**
   * Determines if the mouse is currently over a given line.
   * @param {geometry.line} line - The line to check against the mouse position.
   * @returns {boolean} True if the mouse is on the given line, false otherwise.
   */
  isOnLine(line) {
    var d_per = Math.pow((this.pos.x - line.p1.x) * (line.p1.y - line.p2.y) + (this.pos.y - line.p1.y) * (line.p2.x - line.p1.x), 2) / ((line.p1.y - line.p2.y) * (line.p1.y - line.p2.y) + (line.p2.x - line.p1.x) * (line.p2.x - line.p1.x)); // Similar to the distance between the mouse and the line
    return d_per < this.getClickExtent() * this.getClickExtent();
  }

  /**
   * Get the mouse position snapped to the grid if the grid is enabled.
   * @returns {geometry.point} The mouse position snapped to the grid.
   */
  getPosSnappedToGrid() {
    if (this.scene.grid) {
      return geometry.point(
        Math.round(this.pos.x / this.scene.gridSize) * this.scene.gridSize,
        Math.round(this.pos.y / this.scene.gridSize) * this.scene.gridSize
      );
    } else {
      return this.pos;
    }
  }

  /**
   * Get the mouse position snapped to a set of suggested directions.
   * @param {geometry.point} basePoint - The base point for the snapping.
   * @param {Array} directions - The directions to snap to, each a vector with x and y components.
   * @param {Object} snapData - The object storing the internal state of the snapping process.
   * @returns {geometry.point} The mouse position snapped to some direction.
   */
  getPosSnappedToDirection(basePoint, directions, snapData) {
    const pos = this.getPosSnappedToGrid();
    var x = pos.x - basePoint.x;
    var y = pos.y - basePoint.y;

    if (snapData && snapData.locked) {
      // The snap has been locked
      var k = (directions[snapData.i0].x * x + directions[snapData.i0].y * y) / (directions[snapData.i0].x * directions[snapData.i0].x + directions[snapData.i0].y * directions[snapData.i0].y);
      return geometry.point(basePoint.x + k * directions[snapData.i0].x, basePoint.y + k * directions[snapData.i0].y);
    } else {
      var i0;
      var d_sq;
      var d0_sq = Infinity;
      for (var i = 0; i < directions.length; i++) {
        d_sq = (directions[i].y * x - directions[i].x * y) * (directions[i].y * x - directions[i].x * y) / (directions[i].x * directions[i].x + directions[i].y * directions[i].y);
        if (d_sq < d0_sq) {
          d0_sq = d_sq;
          i0 = i;
        }
      }

      if (snapData && x * x + y * y > Mouse.SNAP_TO_DIRECTION_LOCK_LIMIT * Mouse.SNAP_TO_DIRECTION_LOCK_LIMIT) {
        // lock the snap
        snapData.locked = true;
        snapData.i0 = i0;
      }

      var k = (directions[i0].x * x + directions[i0].y * y) / (directions[i0].x * directions[i0].x + directions[i0].y * directions[i0].y);
      return geometry.point(basePoint.x + k * directions[i0].x, basePoint.y + k * directions[i0].y);
    }
  }
}