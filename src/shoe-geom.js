// Hoof shoe geometry. Needs globals ClipperLib and earcut.
// All 2D work is in "image frame" millimetres (x right, y down, like the photo).
var ShoeGeom = (function () {
  var SC = 1000;
  // Mainline Farriers logo, traced at 3x from the supplied artwork. Coordinates in traced pixels (y down).
  var LOGO = {"w":3000,"h":999,"k":3,"paths":[[2564,826,2558,819,2544,813,2534,813,2514,820,2479,846,2434,888,2403,912,2365,936,2365,938,2369,939,2416,913,2452,888,2516,838,2533,831,2545,831,2553,840,2553,858,2538,913,2520,956,2520,960,2522,960,2546,917,2561,882,2568,856,2568,838],[1170,697,1171,700,1176,701,1181,707,1181,777,1177,783,1170,787,1171,788,1210,787,1202,783,1198,777,1198,751,1201,748,1211,752,1222,769,1238,788,1264,787,1248,776,1228,747,1231,743,1241,739,1248,728,1248,715,1241,703,1230,698],[1200,704,1216,704,1223,707,1230,716,1230,727,1222,738,1216,741,1201,742,1198,740,1198,706],[1054,696,1053,699,1059,701,1063,705,1064,771,1062,780,1053,787,1128,788,1130,765,1126,767,1119,777,1111,781,1084,781,1081,778,1082,745,1105,745,1109,747,1112,753,1115,753,1116,729,1113,728,1111,733,1105,738,1084,738,1081,735,1082,706,1084,704,1114,705,1119,710,1122,717,1126,719,1126,697],[977,696,976,698,983,702,986,707,985,778,980,784,975,786,975,788,1012,789,1014,786,1007,783,1003,777,1003,707,1014,697],[851,697,862,707,862,778,857,784,852,786,852,788,890,788,889,785,881,780,879,775,879,750,882,747,889,748,893,752,909,777,919,788,945,788,944,785,936,782,926,772,910,748,910,745,921,740,929,729,929,713,923,704,915,699,907,697],[882,704,898,704,909,712,911,716,911,728,908,734,901,740,879,740,879,710],[726,697,733,701,738,708,737,778,733,783,728,785,727,788,766,787,760,784,755,778,754,752,757,747,765,749,770,754,793,787,820,788,819,785,811,782,806,777,785,746,796,740,801,735,804,728,804,714,796,702,777,696],[756,704,774,704,783,711,786,716,786,728,779,738,772,741,757,742,755,740],[641,696,630,718,609,773,596,788,624,788,623,785,615,780,616,773,624,758,655,757,659,760,666,779,665,782,658,787,659,788,695,788,696,786,689,783,681,771,653,697],[640,716,643,718,654,746,653,750,636,751,627,748],[503,696,502,699,508,701,511,705,512,754,511,778,501,787,540,788,540,786,533,783,529,778,529,748,533,746,553,747,563,755,564,730,554,739,532,740,529,737,529,707,532,704,559,704,564,706,572,717,575,717,575,697],[1354,697,1339,695,1316,696,1308,699,1299,707,1295,719,1295,728,1299,737,1312,746,1340,756,1347,764,1347,772,1342,779,1336,782,1319,783,1309,779,1296,763,1294,765,1296,787,1319,791,1342,789,1353,784,1361,775,1364,768,1364,755,1361,749,1347,738,1317,728,1311,721,1313,710,1318,705,1326,702,1343,705,1357,720,1359,717,1358,699],[2920,670,2908,672,2895,682,2889,693,2889,712,2902,736,2905,736,2909,732,2911,726,2910,713,2905,701,2906,696,2910,692,2916,691,2930,698,2937,689,2936,681,2929,674],[1615,373,1486,374,1487,379,1494,380,1501,385,1505,395,1505,520,1503,527,1496,534,1488,537,1488,543,1616,544,1619,542,1627,506,1626,503,1622,503,1608,521,1594,528,1546,529,1539,523,1539,463,1541,461,1579,461,1584,463,1591,470,1593,476,1598,477,1600,475,1600,434,1597,431,1593,432,1590,440,1580,447,1543,448,1538,445,1539,387,1591,386,1598,389,1605,396,1613,410,1617,410],[1277,373,1276,378,1290,384,1297,396,1296,525,1290,533,1279,537,1278,542,1334,542,1334,537,1321,533,1313,522,1313,413,1315,412,1421,540,1426,544,1442,543,1443,398,1446,387,1451,382,1461,379,1463,374,1461,372,1408,372,1405,374,1406,379,1420,383,1427,394,1427,491,1425,492,1355,409,1328,374],[1180,372,1180,379,1187,380,1195,386,1199,400,1198,520,1196,528,1190,534,1180,537,1179,542,1250,543,1251,538,1240,534,1232,525,1232,391,1239,382,1249,379,1251,375,1250,373],[1031,372,1029,374,1029,379,1041,383,1047,392,1048,449,1047,523,1040,533,1029,538,1030,543,1156,543,1164,506,1162,503,1157,505,1146,520,1129,528,1087,528,1082,523,1082,393,1090,382,1100,379,1102,374,1099,372],[1004,374,948,372,946,374,947,379,955,380,964,386,969,397,969,490,966,491,870,373,819,373,818,378,831,383,840,394,840,522,834,531,821,537,820,542,876,543,878,540,876,537,863,532,858,527,855,517,856,413,858,412,967,544,983,543,985,541,986,394,990,385,997,380,1003,379],[792,372,722,373,721,375,722,378,734,382,741,393,741,524,734,533,723,537,722,541,724,543,794,542,794,537,787,536,776,528,774,517,775,392,782,382,794,378],[625,369,597,376,540,517,535,526,528,533,518,537,518,543,573,542,572,537,560,531,557,526,557,519,571,483,575,482,636,483,652,523,651,529,646,534,636,539,638,543,706,543,708,541,707,537,697,533,686,519,647,419],[603,403,606,406,630,465,629,469,585,470,577,468],[2749,332,2753,338,2765,344,2766,361,2774,372,2783,377,2800,378,2811,382,2821,392,2825,399,2828,400,2828,387,2824,363,2818,348,2811,340,2801,334,2793,332,2757,332,2752,330],[2774,346,2776,344,2790,345,2793,351,2787,360,2782,360,2775,353],[255,323,255,329,267,333,273,340,275,368,267,519,264,526,258,532,246,538,248,544,308,542,308,537,293,532,286,522,287,447,290,423,290,386,292,369,297,375,303,393,314,416,363,541,370,542,373,540,383,517,395,483,445,366,447,369,449,517,445,528,440,533,429,537,429,542,503,542,501,536,493,534,485,527,483,517,480,344,483,337,488,332,501,328,502,325,500,322,445,323,443,325,380,481,376,478,315,324,312,322],[2966,61,2961,57,2940,69,2918,78,2880,90,2851,96,2832,104,2831,101,2870,19,2865,15,2831,27,2802,43,2769,67,2740,98,2691,91,2648,88,2601,87,2537,90,2462,99,2408,110,2344,126,2308,138,2228,171,2179,195,2117,231,2064,267,1981,333,1937,372,1869,437,1806,492,1805,489,1829,448,1884,367,1940,298,1997,246,2002,238,1999,238,1997,233,2000,231,2006,234,2046,210,2072,188,2137,154,2155,139,2158,141,2177,132,2250,107,2261,101,2283,98,2327,86,2342,79,2336,77,2339,72,2355,78,2367,78,2449,69,2552,68,2638,74,2707,83,2726,84,2729,81,2729,78,2723,75,2689,66,2632,57,2554,50,2545,42,2548,36,2545,25,2537,17,2528,14,2520,15,2512,21,2510,31,2516,41,2511,46,2501,49,2473,50,2459,48,2446,41,2441,22,2427,12,2418,12,2409,19,2407,24,2407,31,2409,35,2417,41,2416,44,2403,54,2379,59,2360,57,2351,53,2346,49,2342,37,2335,29,2328,26,2320,26,2312,30,2306,40,2310,52,2319,57,2316,63,2303,72,2280,79,2257,77,2251,73,2248,65,2240,57,2230,53,2221,54,2213,62,2212,71,2218,80,2225,82,2227,85,2215,99,2187,110,2170,110,2160,108,2157,105,2156,99,2145,90,2129,90,2121,98,2121,109,2127,117,2135,119,2137,122,2133,130,2118,143,2099,152,2087,154,2071,151,2068,146,2058,138,2045,138,2036,144,2033,150,2033,156,2039,166,2050,168,2052,171,2046,184,2034,195,2014,207,1994,210,1982,198,1965,197,1959,200,1953,209,1953,217,1960,226,1964,228,1973,228,1970,244,1954,261,1929,275,1918,276,1910,269,1904,267,1893,267,1883,275,1881,279,1882,291,1889,297,1902,296,1905,300,1904,312,1871,353,1836,404,1809,451,1780,511,1753,531,1708,556,1667,572,1604,587,1557,592,1492,595,219,597,18,599,10,601,282,608,995,614,1467,614,1563,611,1635,601,1681,588,1714,575,1740,562,1770,543,1799,521,1843,483,1978,354,2051,294,2098,260,2158,222,2198,200,2254,173,2331,143,2408,122,2488,107,2530,102,2570,100,2651,100,2731,107,2734,110,2721,132,2714,152,2714,167,2718,169,2727,162,2732,154,2741,130,2759,100,2798,65,2828,47,2844,40,2845,43,2823,87,2808,112,2793,131,2759,163,2764,164,2774,161,2792,151,2808,139,2827,118,2866,104,2897,98,2926,89,2937,83,2940,84,2940,87,2914,119,2862,159,2857,159,2833,138,2828,138,2823,142,2823,145,2844,170,2858,200,2895,308,2897,320,2897,344,2894,368,2895,392,2921,481,2943,570,2949,586,2969,680,2969,697,2964,707,2940,730,2920,757,2904,768,2876,767,2864,764,2855,758,2846,733,2840,707,2834,691,2830,690,2829,693,2832,701,2833,751,2831,753,2824,751,2811,740,2805,721,2803,683,2797,663,2787,650,2733,596,2688,546,2693,545,2715,548,2749,558,2774,573,2801,597,2801,593,2789,577,2768,555,2755,546,2720,531,2665,522,2641,513,2614,495,2598,478,2585,459,2574,436,2567,412,2564,395,2564,356,2568,335,2576,312,2592,286,2616,259,2615,255,2560,279,2516,306,2473,340,2433,379,2397,421,2370,460,2343,509,2317,566,2281,537,2248,516,2223,503,2191,489,2154,477,2100,465,2041,460,1975,462,1919,472,1871,486,1861,492,1865,494,1898,483,1931,476,1970,473,1975,471,2047,471,2078,474,2081,476,2091,476,2120,482,2188,504,2242,530,2289,564,2318,594,2333,613,2355,655,2363,682,2366,700,2367,738,2362,741,2335,744,2260,747,2221,753,2198,759,2156,774,2116,792,2117,795,2179,775,2207,768,2242,763,2329,761,2334,759,2353,759,2386,755,2574,717,2595,718,2616,725,2634,743,2655,776,2664,794,2666,811,2660,831,2642,870,2585,984,2587,987,2636,909,2666,853,2678,817,2678,796,2675,784,2659,751,2642,727,2621,708,2608,702,2594,700,2553,702,2477,719,2448,724,2443,723,2450,711,2454,692,2453,667,2436,604,2436,575,2447,538,2466,503,2486,482,2521,458,2540,449,2556,445,2577,482,2596,504,2609,516,2624,526,2651,539,2659,540,2774,662,2787,683,2790,734,2796,749,2804,759,2819,768,2833,773,2840,773,2887,786,2901,787,2910,785,2924,777,2937,764,2951,744,2981,713,2986,700,2987,679,2957,546,2913,398,2911,387,2911,364,2914,345,2912,308,2906,288,2886,243,2882,225,2882,205,2880,196,2870,172,2910,144,2932,122,2960,82,2966,68],[2553,424,2550,430,2533,435,2523,441,2520,440,2530,430,2547,420],[1897,279,1901,281,1899,286,1894,284],[2588,275,2589,277,2580,287,2565,310,2556,330,2548,368,2548,402,2515,423,2486,452,2460,488,2436,532,2421,570,2403,641,2405,642,2408,639,2422,612,2424,614,2424,621,2438,677,2439,703,2434,714,2422,725,2413,729,2390,733,2387,725,2384,690,2375,657,2360,624,2333,586,2342,556,2371,494,2397,449,2423,413,2453,377,2493,338,2527,311,2561,288],[1966,212,1968,209,1973,209,1975,211,1971,215],[2045,152,2048,149,2053,152,2049,156],[2161,128,2164,133,2157,136,2156,133],[2133,102,2138,101,2140,105,2135,107],[2245,98,2248,95,2253,95,2257,100,2246,101],[2224,67,2230,65,2232,69,2230,71,2225,71],[2319,40,2325,38,2327,41,2323,44],[2420,27,2425,25,2428,28,2422,30]],"split":560};
  function C() { return ClipperLib; }
  function toC(pts) { return pts.map(function (p) { return { X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }; }); }
  function fromC(path) { return path.map(function (p) { return [p.X / SC, p.Y / SC]; }); }
  function offset(paths, d) {
    if (!paths.length) return [];
    var co = new (C().ClipperOffset)(2, 0.04 * SC);
    co.AddPaths(paths, C().JoinType.jtRound, C().EndType.etClosedPolygon);
    var out = new (C().Paths)();
    co.Execute(out, d * SC);
    return out;
  }
  function bool(type, a, b, tree) {
    var c = new (C().Clipper)();
    if (a && a.length) c.AddPaths(a, C().PolyType.ptSubject, true);
    if (b && b.length) c.AddPaths(b, C().PolyType.ptClip, true);
    var out = tree ? new (C().PolyTree)() : new (C().Paths)();
    var nz = C().PolyFillType.pftNonZero;
    c.Execute(type, out, nz, nz);
    return out;
  }
  function diff(a, b) { return bool(C().ClipType.ctDifference, a, b); }
  function uni(a, b) { return bool(C().ClipType.ctUnion, a, b || []); }
  function inter(a, b) { return bool(C().ClipType.ctIntersection, a, b); }
  function area(paths) { var s = 0; paths.forEach(function (p) { s += C().Clipper.Area(p); }); return s / (SC * SC); }

  var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1]]; };
  var add = function (a, b) { return [a[0] + b[0], a[1] + b[1]]; };
  var mul = function (a, k) { return [a[0] * k, a[1] * k]; };
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1]; };
  var len = function (a) { return Math.hypot(a[0], a[1]); };
  var unit = function (a) { var l = len(a) || 1; return [a[0] / l, a[1] / l]; };

  function catmull(pts, seg) {
    var n = pts.length, out = [];
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (var j = 0; j < seg; j++) {
        var t = j / seg, t2 = t * t, t3 = t2 * t, q = [0, 0];
        for (var k = 0; k < 2; k++) {
          q[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        }
        out.push(q);
      }
    }
    return out;
  }

  function biggest(paths) {
    var best = null, ba = -1;
    paths.forEach(function (p) { var a = Math.abs(C().Clipper.Area(p)); if (a > ba) { ba = a; best = p; } });
    return best;
  }

  function insidePaths(pt, paths) {
    var ip = { X: Math.round(pt[0] * SC), Y: Math.round(pt[1] * SC) }, n = 0;
    for (var i = 0; i < paths.length; i++) if (C().Clipper.PointInPolygon(ip, paths[i]) !== 0) n++;
    return n % 2 === 1;
  }

  function circle(c, r, seg) {
    var out = [];
    for (var i = 0; i < seg; i++) { var a = (i / seg) * Math.PI * 2; out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    return out;
  }

  // One side of the frog V with saw teeth biting into the plate.
  function vEdge(A, B, ext, interior, P) {
    var e = unit(sub(B, A)), L = len(sub(B, A));
    var n = [-e[1], e[0]];
    var mid = mul(add(A, B), 0.5);
    if (dot(n, sub(interior, mid)) > 0) n = mul(n, -1);
    var pts = [A];
    var toothLen = L * P.toothSpan, p = Math.max(1, P.toothPitch);
    if (P.toothDepth > 0.05) {
      for (var t = p * 0.6; t + p <= toothLen + 1e-6; t += p) {
        pts.push(add(A, mul(e, t)));
        pts.push(add(add(A, mul(e, t + p * 0.35)), mul(n, P.toothDepth)));
        pts.push(add(A, mul(e, t + p * 0.55)));
      }
    }
    pts.push(add(B, mul(e, ext)));
    return pts;
  }

  function polyAlong(path, s) {
    // path: [[x,y]...] closed; s arc length
    var cum = [0];
    for (var i = 1; i <= path.length; i++) cum.push(cum[i - 1] + len(sub(path[i % path.length], path[i - 1])));
    var total = cum[cum.length - 1];
    s = ((s % total) + total) % total;
    for (var j = 1; j < cum.length; j++) {
      if (cum[j] >= s) {
        var a = path[j - 1], b = path[j % path.length], f = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1);
        return { p: add(a, mul(sub(b, a), f)), t: unit(sub(b, a)), total: total, cum: cum };
      }
    }
    return { p: path[0], t: [1, 0], total: total, cum: cum };
  }

  function raycast(origin, dir, paths) {
    var best = Infinity;
    paths.forEach(function (cp) {
      var p = fromC(cp);
      for (var i = 0; i < p.length; i++) {
        var a = p[i], b = p[(i + 1) % p.length], s = sub(b, a);
        var den = dir[0] * s[1] - dir[1] * s[0];
        if (Math.abs(den) < 1e-9) continue;
        var w = sub(a, origin);
        var t = (w[0] * s[1] - w[1] * s[0]) / den;
        var u = (w[0] * dir[1] - w[1] * dir[0]) / den;
        if (t > 1e-6 && u >= 0 && u <= 1 && t < best) best = t;
      }
    });
    return best;
  }

  // input: {outline:[[x,y]...], apex:[x,y], heelA:[x,y], heelB:[x,y]} in mm (image frame)
  function build(input, P) {
    var O = catmull(input.outline, 10);
    var Oc = uni([toC(O)]);
    if (!Oc.length) throw new Error("Outline crosses itself. Drag a point to untangle it.");
    var plate = offset(Oc, P.edge);
    var platePath = fromC(biggest(plate));

    var A = input.apex, Ha = input.heelA, Hb = input.heelB;
    var heelMid = mul(add(Ha, Hb), 0.5);
    var u = unit(sub(A, heelMid));           // heel -> toe
    var v = [-u[1], u[0]];

    // Frog V
    var interior = mul(add(add(A, Ha), Hb), 1 / 3);
    var left = vEdge(A, Ha, 60, interior, P);
    var right = vEdge(A, Hb, 60, interior, P);
    var F = left.concat(right.slice(1).reverse());
    var Fc = uni([toC(F)]);

    var inner = offset(plate, -P.rimW);
    var pocket = diff(inner, Fc);

    // Toe kerfs across the rim
    var toeIdx = 0, toeBest = -Infinity;
    platePath.forEach(function (p, i) { var d = dot(sub(p, heelMid), u); if (d > toeBest) { toeBest = d; toeIdx = i; } });
    var cum0 = polyAlong(platePath, 0).cum;
    var sToe = cum0[toeIdx];
    var kerfs = [];
    for (var k = 0; k < P.kerfN; k++) {
      var s = sToe + (k - (P.kerfN - 1) / 2) * P.kerfSp;
      var at = polyAlong(platePath, s), t = at.t, nn = [-t[1], t[0]];
      var hw = P.kerfW / 2, hl = P.rimW + P.edge + 4;
      kerfs.push(toC([
        add(add(at.p, mul(t, -hw)), mul(nn, -hl)),
        add(add(at.p, mul(t, hw)), mul(nn, -hl)),
        add(add(at.p, mul(t, hw)), mul(nn, hl)),
        add(add(at.p, mul(t, -hw)), mul(nn, hl))
      ]));
    }
    var rim = diff(diff(plate, inner), Fc.concat(kerfs));

    var bb = platePath.reduce(function (b, p) { return [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])]; }, [Infinity, Infinity, -Infinity, -Infinity]);
    var c0 = [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];

    // Logo: traced artwork, laid out so it reads upright (top toward the toe) on the hoof-facing side.
    var logo = [], logoCenter = null, logoKeep = [];
    var L = P.logoData || LOGO;
    if (P.logoOn && L) {
      var reach = raycast(A, u, inner);
      if (isFinite(reach)) {
        logoCenter = add(A, mul(u, reach * P.logoPos));
        var part = Math.round(P.logoPart || 0), cut = L.split * L.k;
        var x0 = part === 1 ? cut : 0, x1 = part === 2 ? cut : L.w;
        var src = L.paths.map(function (f) { var pts = []; for (var i = 0; i < f.length; i += 2) pts.push({ X: f[i], Y: f[i + 1] }); return pts; });
        var art = bool(C().ClipType.ctIntersection, src, [[{ X: x0, Y: 0 }, { X: x1, Y: 0 }, { X: x1, Y: L.h }, { X: x0, Y: L.h }]]);
        if (part !== 0) {
          // keep the crop tidy: drop slivers the crop line left behind
          art = art.filter(function (p) { return Math.abs(C().Clipper.Area(p)) > 40 * L.k * L.k; });
        }
        var lb = art.reduce(function (b, p) { p.forEach(function (q) { b[0] = Math.min(b[0], q.X); b[1] = Math.min(b[1], q.Y); b[2] = Math.max(b[2], q.X); b[3] = Math.max(b[3], q.Y); }); return b; }, [Infinity, Infinity, -Infinity, -Infinity]);
        if (art.length && isFinite(lb[0])) {
          var sc = P.logoW / (lb[2] - lb[0]), lcx = (lb[0] + lb[2]) / 2, lcy = (lb[1] + lb[3]) / 2;
          var sx = P.mirror ? -1 : 1, dC = sub(logoCenter, c0);
          var mC = [sx * dot(dC, v), dot(dC, u)];
          var place = function (lx, ly) {
            var mx = mC[0] + (lx - lcx) * sc, my = mC[1] - (ly - lcy) * sc;
            return add(c0, add(mul(v, mx * sx), mul(u, my)));
          };
          var placed = art.map(function (p) { return toC(p.map(function (q) { return place(q.X, q.Y); })); });
          placed = uni(placed);
          logo = inter(P.logoBoost > 0 ? offset(placed, P.logoBoost) : placed, offset(pocket, -1.2));
          logoKeep = [toC([place(lb[0], lb[1]), place(lb[2], lb[1]), place(lb[2], lb[3]), place(lb[0], lb[3])])];
        }
      }
    }

    // Holes on a hex grid inside the pocket
    var r = P.holeD / 2;
    var zone = offset(pocket, -(P.holeMargin + r));
    if (logoKeep.length) zone = diff(zone, offset(logoKeep, P.holeMargin + r));
    var holes = [], centers = [];
    if (P.holeD > 0.2 && P.holeSp > 2 && zone.length) {
      var rowH = P.holeSp * Math.sqrt(3) / 2;
      for (var row = -14; row <= 14; row++) {
        for (var col = -14; col <= 14; col++) {
          var cu = row * rowH, cv = col * P.holeSp + (row & 1 ? P.holeSp / 2 : 0);
          var c = add(add(c0, mul(u, cu)), mul(v, cv));
          if (insidePaths(c, zone)) { centers.push(c); holes.push(toC(circle(c, r, 28))); }
        }
      }
    }

    var base = diff(plate, Fc.concat(holes));

    // Dimensions along the hoof axis
    var du = platePath.map(function (p) { return dot(p, u); }), dv = platePath.map(function (p) { return dot(p, v); });
    var dims = { length: Math.max.apply(null, du) - Math.min.apply(null, du), width: Math.max.apply(null, dv) - Math.min.apply(null, dv) };

    var cutIn = logo.length && P.logoCut;
    var depth = Math.min(P.logoT, P.plateT - 0.8);
    var layers = cutIn ? [
      { name: "base", paths: base, z0: 0, z1: P.plateT - depth },
      { name: "baseTop", paths: diff(base, logo), z0: P.plateT - depth - 0.2, z1: P.plateT }
    ] : [{ name: "base", paths: base, z0: 0, z1: P.plateT }];
    layers.push({ name: "rim", paths: rim, z0: P.plateT - 0.2, z1: P.plateT + P.rimH });
    if (logo.length && !cutIn) layers.push({ name: "logo", paths: logo, z0: P.plateT - 0.2, z1: P.plateT + P.logoT });

    var vol = area(base) * P.plateT + area(rim) * P.rimH + (logo.length ? (cutIn ? -1 : 1) * area(logo) * (cutIn ? depth : P.logoT) : 0);

    return {
      u: u, v: v, center: c0, dims: dims, volume: Math.abs(vol), holeCount: holes.length,
      layers: layers,
      overlay: {
        outline: O, base: base.map(fromC), plate: plate.map(fromC), inner: inner.map(fromC), frog: Fc.map(fromC),
        holes: holes.map(fromC), logo: logo.map(fromC), logoCenter: logoCenter, kerfs: kerfs.map(fromC), rim: rim.map(fromC)
      }
    };
  }

  // Build triangle soup in model coordinates (toe +Y, mirrored if requested)
  function mesh(shoe, mirror) {
    var u = shoe.u, v = shoe.v, c = shoe.center, sx = mirror ? -1 : 1;
    function M(p) { var d = sub(p, c); return [sx * dot(d, v), dot(d, u)]; }
    function signedArea(r) { var s = 0; for (var i = 0; i < r.length; i++) { var a = r[i], b = r[(i + 1) % r.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
    var tris = [];
    function tri(a, b, c2) { tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c2[0], c2[1], c2[2]); }
    function walls(ring, z0, z1) {
      for (var i = 0; i < ring.length; i++) {
        var a = ring[i], b = ring[(i + 1) % ring.length];
        var a0 = [a[0], a[1], z0], b0 = [b[0], b[1], z0], a1 = [a[0], a[1], z1], b1 = [b[0], b[1], z1];
        tri(a0, b0, b1); tri(a0, b1, a1);
      }
    }
    function solid(outer, holes, z0, z1) {
      if (signedArea(outer) < 0) outer.reverse();
      holes.forEach(function (h) { if (signedArea(h) > 0) h.reverse(); });
      var flat = [], holeIdx = [], all = [];
      outer.forEach(function (p) { flat.push(p[0], p[1]); all.push(p); });
      holes.forEach(function (h) { holeIdx.push(all.length); h.forEach(function (p) { flat.push(p[0], p[1]); all.push(p); }); });
      var idx = earcut(flat, holeIdx.length ? holeIdx : null, 2);
      for (var i = 0; i < idx.length; i += 3) {
        var a = all[idx[i]], b = all[idx[i + 1]], d = all[idx[i + 2]];
        var cr = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
        if (cr < 0) { var tmp = b; b = d; d = tmp; }
        tri([a[0], a[1], z1], [b[0], b[1], z1], [d[0], d[1], z1]);
        tri([a[0], a[1], z0], [d[0], d[1], z0], [b[0], b[1], z0]);
      }
      walls(outer, z0, z1);
      holes.forEach(function (h) { walls(h, z0, z1); });
    }
    shoe.layers.forEach(function (L) {
      var tree = bool(C().ClipType.ctUnion, L.paths, [], true);
      (function walk(nodes) {
        nodes.forEach(function (node) {
          var outer = fromC(node.Contour()).map(M);
          var hs = node.Childs().map(function (h) { return fromC(h.Contour()).map(M); });
          if (outer.length >= 3) solid(outer, hs, L.z0, L.z1);
          node.Childs().forEach(function (h) { walk(h.Childs()); });
        });
      })(tree.Childs());
    });
    return new Float32Array(tris);
  }

  function stl(tris) {
    var n = tris.length / 9, buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf);
    var head = "Shoe Builder - units mm";
    for (var i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
    dv.setUint32(80, n, true);
    var o = 84;
    for (var t = 0; t < n; t++) {
      var k = t * 9;
      var ax = tris[k], ay = tris[k + 1], az = tris[k + 2], bx = tris[k + 3], by = tris[k + 4], bz = tris[k + 5], cx = tris[k + 6], cy = tris[k + 7], cz = tris[k + 8];
      var ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(o, nx / nl, true); dv.setFloat32(o + 4, ny / nl, true); dv.setFloat32(o + 8, nz / nl, true);
      for (var j = 0; j < 9; j++) dv.setFloat32(o + 12 + j * 4, tris[k + j], true);
      dv.setUint16(o + 48, 0, true);
      o += 50;
    }
    return new Uint8Array(buf);
  }

  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offsetN = 0;
    var d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var cdh = new DataView(new ArrayBuffer(46));
      cdh.setUint32(0, 0x02014b50, true); cdh.setUint16(4, 20, true); cdh.setUint16(6, 20, true); cdh.setUint16(8, 0x0800, true); cdh.setUint16(10, 0, true);
      cdh.setUint16(12, dosTime, true); cdh.setUint16(14, dosDate, true); cdh.setUint32(16, crc, true);
      cdh.setUint32(20, data.length, true); cdh.setUint32(24, data.length, true); cdh.setUint16(28, name.length, true);
      cdh.setUint32(42, offsetN, true);
      central.push(new Uint8Array(cdh.buffer), name);
      offsetN += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offsetN, true);
    var all = parts.concat(central, [new Uint8Array(end.buffer)]);
    var total = all.reduce(function (s, p) { return s + p.length; }, 0), out = new Uint8Array(total), o = 0;
    all.forEach(function (p) { out.set(p, o); o += p.length; });
    return out;
  }

  // Printable scale reference: 116 x 26 x 1.2 mm card, ticks cut through every 10 mm,
  // long slots at 0 and 100 mm. Tape to the sole; the slots show the dark sole behind.
  function card() {
    var W = 116, H = 26, x0 = -58, y0 = -13;
    var body = [toC([[x0, y0], [x0 + W, y0], [x0 + W, y0 + H], [x0, y0 + H]])];
    var cuts = [];
    for (var i = 0; i <= 10; i++) {
      var x = -50 + i * 10, major = (i === 0 || i === 10), w = major ? 1.0 : 0.8, h = major ? 16 : 7;
      var yb = y0 + 3;
      cuts.push(toC([[x - w / 2, yb], [x + w / 2, yb], [x + w / 2, yb + h], [x - w / 2, yb + h]]));
    }
    var paths = diff(body, cuts);
    return mesh({ u: [0, -1], v: [1, 0], center: [0, 0], layers: [{ paths: paths, z0: 0, z1: 1.2 }] }, false);
  }

  return { build: build, mesh: mesh, stl: stl, zip: zip, catmull: catmull, card: card, LOGO: LOGO };
})();
if (typeof module !== "undefined") module.exports = ShoeGeom;
