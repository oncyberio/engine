var Packer = function (w, h) {
  this.init(w, h);
};

const dummy = {
  textureIndex: 5,
  fit: {
    dummy: true,
    x: 0,
    y: 0,
    w: 1024,
    h: 1024,
    used: true,
    down: {
      x: 0,
      y: 256,
      w: 1024,
      h: 768,
    },
    right: {
      x: 256,
      y: 0,
      w: 768,
      h: 256,
    },
  },
};

Packer.prototype = {
  init: function (w, h) {
    this.root = { x: 0, y: 0, w: w, h: h };
    this.loop = 0;
    this.size = {
      w: w,
      h: h,
    };
    this.seen = {};
    this.index = 0;
    this.packingNB = 0;
    this.maxSize = { w: 0, h: 0 };
  },

  setSize: function (w, h) {
    this.size.w = w;

    this.size.h = h;
  },

  reset: function (w, h) {
    this.seen = {};
    this.root = { x: 0, y: 0, w: this.size.w, h: this.size.h };
    this.loop = 0;
    this.index = 0;
    this.packingNB = 0;

    this.maxSize = { w: 0, h: 0 };
    // this.root.used = false
  },

  fit: function (blocks, opts = {}) {
    var index = 0;

    var n, node, block;

    const TEXTURE_SIZE = opts.needsFitData;

    var wasteSpaces = [{ x: 0, y: 0, w: this.size.w, h: this.size.h }];

    var sortedBlocks = blocks;

    // sortedBlocks =  [...blocks]
    sortedBlocks = [...blocks].sort((a, b) => b.w * b.h - a.w * a.h);

    for (n = 0; n < sortedBlocks.length; n++) {
      block = sortedBlocks[n];

      if (opts.max == null || opts.max >= this.loop + 1) {
        delete block.textureIndex;

        delete block.fit;

        if (opts.sort) {
          this.refitWaste(block, wasteSpaces);
        } else {
          this.refit(block);
        }
      } else {
        block = Object.assign(block, dummy);

        block.textureIndex = dummy.textureIndex;
      }

      this.maxSize.w = Math.max(this.maxSize.w, block.fit.x + block.w);
      // console.log(  this.maxSize.w )
      this.maxSize.h = Math.max(this.maxSize.h, block.fit.y + block.h);

      if (opts.needsFitData != null) {
        block.uvScale = {
          x: block.w / TEXTURE_SIZE,
          y: block.h / TEXTURE_SIZE,
        };

        block.uvPos = {
          x: block.fit.x / TEXTURE_SIZE,
          y: block.fit.y / TEXTURE_SIZE,
        };
      }
    }

    return this.loop;
  },

  refitWaste: function (block, wasteSpaces) {
    this.packingNB++;
    var fitted = false;

    // Sort waste spaces by largest area first
    wasteSpaces.sort((a, b) => b.w * b.h - a.w * a.h);

    for (let i = 0; i < wasteSpaces.length && !fitted; i++) {
      var node = wasteSpaces[i];
      if (block.w <= node.w && block.h <= node.h) {
        block.fit = { x: node.x, y: node.y };
        block.textureIndex = this.loop;

        // Split and redistribute remaining space
        if (node.w - block.w > 0) {
          wasteSpaces.push({
            x: node.x + block.w,
            y: node.y,
            w: node.w - block.w,
            h: block.h,
          });
        }
        if (node.h - block.h > 0) {
          wasteSpaces.push({
            x: node.x,
            y: node.y + block.h,
            w: block.w,
            h: node.h - block.h,
          });
        }

        wasteSpaces.splice(i, 1); // Remove the used space
        fitted = true;
      }
    }

    if (!fitted) {
      this.loop++;
      this.root = { x: 0, y: 0, w: this.size.w, h: this.size.h };
      wasteSpaces = [{ x: 0, y: 0, w: this.size.w, h: this.size.h }];
      this.refit(block);
    }
  },

  refit: function (block) {
    if (this.seen[block.url]) {
      const seenBlock = this.seen[block.url];

      block.fit = Object.assign({}, seenBlock.fit);

      block.textureIndex = seenBlock.textureIndex;

      return;
    }

    this.packingNB++;

    let bestFit = null;
    let smallestIncrease = Number.MAX_SAFE_INTEGER;
    let enlargeDimension = null; // Tracks which dimension is being enlarged ('width' or 'height')

    const tryFit = (node) => {
      let widthIncrease =
        Math.max(this.maxSize.w, node.x + block.w) - this.maxSize.w;
      // let heightIncrease = Math.max(this.maxSize.h, node.y + block.h) - this.maxSize.h;

      // Determine the smaller of the two increases.
      // let smallerIncrease = Math.min(widthIncrease, heightIncrease);
      let smallerIncrease = widthIncrease;

      // Check if this is the smallest increase found so far.
      if (smallerIncrease < smallestIncrease) {
        bestFit = node;
        smallestIncrease = smallerIncrease;
        // enlargeDimension = widthIncrease <= heightIncrease ? 'width' : 'height';
        enlargeDimension = "width";
      }
    };

    // Recursively search for the best fit.
    const evaluateFits = (root) => {
      if (!root) return;
      if (!root.used && block.w <= root.w && block.h <= root.h) {
        tryFit(root);
      }
      evaluateFits(root.right);
      evaluateFits(root.down);
    };

    evaluateFits(this.root);

    if (bestFit) {
      // Apply the best fit found.
      block.fit = this.splitNode(bestFit, block.w, block.h);
      block.textureIndex = this.loop;
      this.seen[block.url] = block;
    } else {
      console.log("not found /not suitable");
      // debugger;
      // If no suitable space was found, increase the loop counter and reset.
      this.loop++;
      this.root = { x: 0, y: 0, w: this.size.w, h: this.size.h };
      this.refit(block); // Consider iterative call or a limit on retries to prevent stack overflow.
    }
  },
  findNode: function (root, w, h) {
    if (root.used) {
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    } else if (w <= root.w && h <= root.h) {
      return root;
    } else {
      return null;
    }
  },

  splitNode: function (node, w, h) {
    node.used = true;
    node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
    node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h };
    return node;
  },
};

export default Packer;
