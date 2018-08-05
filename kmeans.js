// inspiration from http://www.bytemuse.com/post/k-means-clustering-visualization/
$(function() {
  var NUM_POINTS = 500

  var $numClusters = $('#num-clusters')
  var numClusters = parseInt($numClusters.val(), 10)
  var $numcenters = $('#num-centers')
  var numcenters = parseInt($numClusters.val(), 10)

  var $meanSquareValue = $('.mean-square-value')

  var width = $('#chart').width()
  var height = width

  var svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  pointsGroup = svg.append('g').attr('id', 'points')
  var centersGroup = svg.append('g').attr('id', 'centers')
  var voronoiGroup = svg.append('g').attr('id', 'voronoi')
  var triangle = d3.svg
    .symbol()
    .type('smile')
    .size(function(d) {
      return 200
    })

  var colors = d3.scale.category20()

  var points = []
  var centers = []
  var centerBins = []

  var xScale = d3.scale
    .linear()
    .range([0, width])
    .domain(
      d3.extent(points, function(d) {
        return d.x
      })
    )
    .nice()

  var yScale = d3.scale
    .linear()
    .range([height, 0])
    .domain(
      d3.extent(points, function(d) {
        return d.y
      })
    )
    .nice()

  var randomness = 25
  var $step = $('.step')

  function resetCenterUpdateText() {
    $step.addClass('find')
    $step.html('Find closest center')

    $('.active').removeClass('active')
    $('.closest').addClass('active')
  }

  $step.click(function() {
    if ($step.hasClass('find')) {
      findClosestCenter()
      findClosestCenterAnimation()
      $step.removeClass('find')
      $step.html('Update center')

      $('.active').removeClass('active')
      $('.update').addClass('active')
    } else {
      updateCenter()
      updateCenterAnimation()
      resetCenterUpdateText()
    }
  })

  $('.closest').on('click', function() {
    if ($('.closest').hasClass('active')) {
      $step.click()
    }
  })

  $('.update').on('click', function() {
    if ($('.update').hasClass('active')) {
      $step.click()
    }
  })

  $('.new-points').click(function() {
    resetPoints()
  })

  $('.new-points-self').click(function() {
    points = []
    addPoint()
  })

  $numClusters.blur(function() {
    var numClustersNew = parseInt($numClusters.val(), 10)
    if (!isNaN(numClustersNew) && numClustersNew != numClusters) {
      resetPoints()
    }
  })

  $numcenters.blur(function() {
    var numcentersNew = parseInt($numcenters.val(), 10)
    if (!isNaN(numcentersNew) && numcentersNew != numcenters) {
      generateClusters()
    }
  })

  $('.new-centers').click(function() {
    generateClusters()
  })

  $numClusters.blur(function() {
    var numClustersNew = parseInt($numClusters.val(), 10)
    if (!isNaN(numClustersNew) && numClustersNew != numClusters) {
      resetPoints()
    }
  })

  $numcenters.blur(function() {
    var numcentersNew = parseInt($numcenters.val(), 10)
    if (!isNaN(numcentersNew) && numcentersNew != numcenters) {
      generateClusters()
    }
  })

  function uncolorPoints() {
    pointsGroup.selectAll('*').remove()
    pointsGroup
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('cx', function(d) {
        return d[0]
      })
      .attr('cy', function(d) {
        return d[1]
      })
      .attr('r', 3)
  }

  function addPoint(clickArea) {
    points = []
  }

  function resetPoints() {
    resetCenterUpdateText()
    points = []
    var variance = randomness / 2 + 5
    var percentageClusteredPoints = (100 - 0.8 * randomness) / 100

    numClusters = parseInt($numClusters.val(), 10)

    for (var i = 0; i < numClusters; i++) {
      var xNorm = d3.random.normal(randomCenter(width), variance)
      var yNorm = d3.random.normal(randomCenter(height), variance)

      for (
        var j = 0;
        j < (percentageClusteredPoints * NUM_POINTS) / numClusters;
        j++
      ) {
        points.push([normalPt(xNorm), normalPt(yNorm)])
      }
    }

    var length = points.length
    for (var i = 0; i < NUM_POINTS - length; i++) {
      points.push([randomCenter(width), randomCenter(height)])
    }

    uncolorPoints()
    resetCenterUpdateText()
    voronoiGroup.selectAll('*').remove()

    $meanSquareValue.html('not yet calculated')
  }

  function generateClusters() {
    centers = []
    numcenters = parseInt($numcenters.val(), 10)
    uncolorPoints()
    resetCenterUpdateText()

    for (var k = 0; k < numcenters; k++) {
      var randomX = randomCenter(width)
      var randomY = randomCenter(height)
      centers.push([randomX, randomY])
    }

    centersGroup.selectAll('*').remove()
    voronoiGroup.selectAll('*').remove()

    centersGroup
      .selectAll('path')
      .data(centers)
      .enter()
      .append('path')
      .attr('d', triangle)
      .attr('fill', function(d, ndx) {
        return colors(ndx)
      })
      .style('stroke', 'black')
      .style('stroke-width', '0.7')
      .attr('transform', function(d) {
        return 'translate(' + d[0] + ',' + d[1] + ')'
      })

    $meanSquareValue.html('not yet calculated')
  }

  function findClosestCenter() {
    centerBins = []
    for (var i = 0; i < numcenters; i++) {
      centerBins.push([])
    }

    for (var i = 0; i < points.length; i++) {
      var point = points[i]
      var minDist = Infinity
      var minIndex = 0
      for (var j = 0; j < centers.length; j++) {
        center = centers[j]
        var d = distance(point, center)
        if (d < minDist) {
          minDist = d
          minIndex = j
        }
      }
      centerBins[minIndex].push(point)
    }

    var meanSquaredDistance = 0
    for (var i = 0; i < centerBins.length; i++) {
      bin = centerBins[i]

      for (var j = 0; j < bin.length; j++) {
        var dist = distance(centers[i], bin[j])
        meanSquaredDistance += dist * dist
      }
    }

    meanSquaredDistance /= NUM_POINTS
    $meanSquareValue.html(meanSquaredDistance.toFixed(2))
  }

  function findClosestCenterAnimation() {
    pointsGroup
      .selectAll('*')
      .data(points)
      .transition()
      .attr('fill', function(d, ndx) {
        for (var i = 0; i < centerBins.length; i++) {
          if (centerBins[i].indexOf(d) != -1) {
            return colors(i)
          }
        }
      })

    voronoiGroup.selectAll('*').remove()

    voronoiGroup
      .selectAll('path')
      .data(d3.geom.voronoi(centers))
      .enter()
      .append('path')
      .style('fill', function(d, ndx) {
        return colors(ndx)
      })
      .attr('d', function(d) {
        return 'M' + d.join('L') + 'Z'
      })
  }

  function updateCenter() {
    var meanSquaredDistance = 0
    for (var i = 0; i < centerBins.length; i++) {
      bin = centerBins[i]
      newCenter = avgXY(bin)

      for (var j = 0; j < bin.length; j++) {
        var dist = distance(newCenter, bin[j])
        meanSquaredDistance += dist * dist
      }
      if (!isNaN(newCenter[0]) && !isNaN(newCenter[1])) {
        centers[i] = newCenter
      }
    }

    meanSquaredDistance /= NUM_POINTS
    $meanSquareValue.html(meanSquaredDistance.toFixed(2))
  }

  function updateCenterAnimation() {
    centersGroup
      .selectAll('path')
      .data(centers)
      .transition()
      .attr('transform', function(d) {
        return 'translate(' + d[0] + ',' + d[1] + ')'
      })
  }

  generateClusters()
  function randomCenter(n) {
    return Math.random() * n
  }

  function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
  }

  function avgXY(arr) {
    var avgX =
      d3.sum(arr, function(d) {
        return d[0]
      }) / arr.length
    var avgY =
      d3.sum(arr, function(d) {
        return d[1]
      }) / arr.length
    return [avgX, avgY]
  }
  function normalPt(normalFn) {
    var val = normalFn()
    if (val > 0 && val < width) {
      return val
    } else {
      return normalPt(normalFn)
    }
  }
})
