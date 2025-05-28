/**
 * @typedef {(MusicNotation) => string} FormatHandler
 */
/**
 * @typedef {(string) => MusicNotation} ParseHandler
 */

;(function(global) {
  function checkConstructor(which, target) {
    if (!(which instanceof target))
      throw TypeError("Called as a function. Did you forget 'new'?")
  }

  function unknownFormat(label) {
    throw RangeError("未知格式: " + label)
  }

  /**
   * 比率
   * @param {number} a 分子
   * @param {number} b 分母
   * @constructor
   */
  function Rate(a = 1, b = 1) {
    checkConstructor(this, Rate)
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw RangeError("分子分母必须为整数")
    if (!b) throw RangeError("分母不能为 0")
    this.a = a
    this.b = b
    /** 化简 */
    this.simplify = function() {
      // 求最大公约数并化简此分数
      let big = Math.max(this.a, this.b)
      let small = Math.min(this.a, this.b)
      while (small) {
        const temp = small
        small = big % small
        big = temp
      }
      this.a /= big
      this.b /= big
      return this
    }
  }

  /**
   * 节拍。
   * @param {Rate} rate 时值倍率；如 1/2 表示为基础时值的一半
   * @param {number[]} [tones] 音调，支持和弦，为空时表示休止或停顿
   * @constructor
   */
  function Beat(rate, tones = []) {
    checkConstructor(this, Beat)
    /** 时值倍率；如 1/2 表示为基础时值的一半 */
    this.rate = rate
    /** 音调，支持和弦，为空时表示休止或停顿 */
    this.tones = tones
  }

  /**
   * 乐谱
   * @param {string} [name] 音乐名
   * @param {string} [author] 作者
   * @param {string} [transcribedBy] 改编
   * @param {number} [keyNote] 基准音调
   * @param {number} [bpm] 每分钟节拍数
   * @param {Beat[]} [beats] 节拍
   * @constructor
   */
  function MusicNotation(name = "", author = "", transcribedBy = "", keyNote = 0, bpm = 0, beats = []) {
    checkConstructor(this, MusicNotation)
    /** 音乐名 */
    this.name = name
    /** 作者 */
    this.author = author
    /** 改编 */
    this.transcribedBy = transcribedBy
    /** 基准音调 */
    this.keyNote = keyNote
    /** 每分钟节拍数 */
    this.bpm = bpm
    /** 节拍 */
    this.beats = beats
  }

  /**
   * 触发操作
   * @param {number[]} [locations] 要触发的位置
   * @param {number} [postDelay] 点击后的延时
   * @constructor
   */
  function HitAction(locations = [], postDelay = 0) {
    checkConstructor(this, HitAction)
    /** 要触发的位置 */
    this.locations = locations
    /** 点击后的延时 */
    this.postDelay = postDelay
  }

  /**
   * 键盘布局
   * @param {Array} [keys] 键位，按顺序从低音到高音
   * @param {number} [keyOffset] 按键偏移
   * @param {boolean} [semitone] 是否启用半音，即十二平均律
   * @constructor
   */
  function KeyLayout(keys = [], keyOffset = 0, semitone = false) {
    checkConstructor(this, KeyLayout)
    /** 键位，按顺序从低音到高音 */
    this.keys = keys
    /** 按键偏移 */
    this.keyOffset = keyOffset
    /** 是否启用半音，即十二平均律 */
    this.semitone = semitone
  }

  const langUtil = {
    /**
     * 分组
     * @template T
     * @param {T[]} arr
     * @param {(T) => keyof T} keyMapper
     * @return {Record<keyof T, T[]>}
     */
    groupBy(arr, keyMapper) {
      const result = {}
      arr.forEach((it) => {
        const key = keyMapper(it)
        if (!result[key]) {
          result[key] = []
        }
        result[key].push(it)
      })
      return result
    },
    /**
     * 插入排序，在输入几乎是已经排好序的情况下时间复杂度最小
     * @template T
     * @param {T[]} arr
     * @param {function(T, T): boolean} comparator
     */
    insertionSort(arr, comparator) {
      let len = arr.length, i, j, key
      for (i = 1; i < len; i++) {
        key = arr[i] // 选取要插入的元素
        j = i - 1

        /* 将大于key的元素向后移动一位 */
        while (j >= 0 && !comparator(arr[j], key)) {
          arr[j + 1] = arr[j]
          j = j - 1
        }
        arr[j + 1] = key // 插入key到正确的位置
      }
    }
  }

  const musicUtil = {
    missingKeyException: "MissingKeyException",
    /** 以 0 开始的十二平均律中的半音 */
    semitones: [1, 3, 6, 8, 10],
    /** 以 0 开始的十二平均律中的自然音 */
    naturals: [0, 2, 4, 5, 7, 9, 11],
    /**
     * 判断是否是半音（钢琴黑键）
     * @param {number} tet12 十二平均律
     * @return {boolean}
     */
    isSemitone(tet12) {
      let note = tet12 % 12
      if (note < 0) note += 12
      return this.semitones.includes(note)
    },
    /**
     * 判断是否是自然音（钢琴白键）
     * @param {number} tet12 十二平均律
     * @return {boolean}
     */
    isNatural(tet12) {
      let note = tet12 % 12
      if (note < 0) note += 12
      return this.naturals.includes(note)
    },
    /**
     * 基本音级转十二平均律
     * @param {number} basic 基本音级 0~6
     * @return {number} 十二平均律 0~11
     */
    basicNoteTo12TET(basic) {
      // 计算八度变化
      let octaveShift = Math.sign(basic) * Math.floor(Math.abs(basic) / 7)
      // 计算基础音符在 0 到 6 的范围内的对应值
      let basicInRange = basic % 7
      // 将负数的情况处理为正数，并对应到负八度
      if (basicInRange < 0) {
        basicInRange += 7
        // 八度向下移动
        octaveShift--
      }
      basicInRange = this.naturals[basicInRange]
      // 返回计算的值
      return basicInRange + octaveShift * 12
    },
    /**
     * 十二平均律转基本音级
     * @param {number} tet12 十二平均律 0~11
     * @return {number} 基本音级 0~6
     */
    tet12ToBasicNote(tet12) {
      let octaveShift = Math.sign(tet12) * Math.floor(Math.abs(tet12) / 12)
      let tet12Rang = tet12 % 12
      if (tet12Rang < 0) {
        tet12Rang += 12
        octaveShift--
      }
      const note = this.naturals.indexOf(tet12Rang)
      if (note < 0) throw RangeError("半音无法转为基本音级")
      return note + octaveShift * 7
    },
    /**
     * 寻找合适的变调偏移
     * @param {MusicNotation} mn
     * @param {KeyLayout} kl
     * @return {number}
     */
    findSuitableOffset(mn, kl) {
      let minProducer = NaN
      let maxProducer = NaN
      let minConsumer = NaN
      let maxConsumer = NaN

      const producer = kl.keys.map((_, index) => {
        let note = index + kl.keyOffset
        if (!kl.semitone) note = this.basicNoteTo12TET(note)
        if (isNaN(minProducer) || note < minProducer) minProducer = note
        if (isNaN(maxProducer) || note > maxProducer) maxProducer = note
        return note
      })
      const consumer = mn.beats.flatMap((it) => it.tones.map((it) => {
        const note = it + mn.keyNote
        if (isNaN(minConsumer) || note < minConsumer) minConsumer = note
        if (isNaN(maxConsumer) || note > maxConsumer) maxConsumer = note
        return note
      }))

      if (isNaN(minProducer)) throw Error(this.missingKeyException)
      if (isNaN(minConsumer)) return 0

      // minOffset 是使 consumer 的最小值对齐 producer 的最小值，maxOffset 同理
      const minOffset = minProducer - minConsumer
      const maxOffset = maxProducer - maxConsumer

      let offset = Math.max(0, minOffset)
      while (offset <= maxOffset) {
        if (consumer.every((it) => producer.includes(it + offset))) return offset
        offset++
      }

      offset = Math.min(-1, maxOffset)
      while (offset >= minOffset) {
        if (consumer.every((it) => producer.includes(it + offset))) return offset
        offset--
      }

      throw Error(this.missingKeyException)
    },
    /**
     * 创建触发操作
     * @param {MusicNotation} mn
     * @param {KeyLayout} kl
     * @return {HitAction[]}
     */
    createHitActions(mn, kl) {
      const offset = this.findSuitableOffset(mn, kl)
      /** @type {Record<number, number>} */
      const keysMap = Object.create(null)
      const baseTime = 60_000 / mn.bpm

      // 构建十二平均律到按键点位的映射关系
      for (let i = 0; i < kl.keys.length; i++) {
        let note = i + kl.keyOffset
        if (!kl.semitone) note = this.basicNoteTo12TET(note)
        keysMap[note] = i
      }
      return mn.beats.map((it) => {
        const locations = it.tones.map((it) => {
          const key = keysMap[it + mn.keyNote + offset]
          if (key === void 0 || key === null) throw Error(this.missingKeyException)
          return key
        })
        const postDelay = Math.floor(it.rate.a * baseTime / it.rate.b)
        return new HitAction(locations, postDelay)
      })
    }
  }

  const skyStudioUtil = {
    checkPitchLevel(p) {
      if (!Number.isInteger(p)) throw TypeError("pitchLevel 必须为整数")
      if (p < 0 || p > 11) throw RangeError("pitchLevel 超出范围 [0, 11]")
      return p
    },
    checkBpm(p) {
      if (!Number.isInteger(p)) throw TypeError("bpm 必须为整数")
      if (!p || p <= 0) throw RangeError("bpm 必须大于 0")
      return p
    }
  }

  /** @type {Record<string, () => FormatHandler>} */
  const formatters = Object.create(null)
  /** @type {Record<string, () => ParseHandler>} */
  const parsers = Object.create(null)

  //<editor-fold desc="Formatters">

  formatters["sky-studio-json"] = () => {
    const kl = new KeyLayout(Array.from(Array(15).keys()))

    return function(mn) {
      const hitActions = musicUtil.createHitActions(mn, kl)
      let time = 0
      const skyStudioSheet = {
        name: mn.name,
        author: mn.author,
        transcribedBy: mn.transcribedBy,
        bitsPerPage: 16,
        pitchLevel: mn.keyNote % 12,
        bpm: mn.bpm,
        songNotes: hitActions.flatMap((it) => {
          const keys = it.locations
            .sort((a, b) => b - a)
            .map((key, i) => ({ time, key: `${i ? 2 : 1}Key${key}` }))
          time += it.postDelay
          return keys
        })
      }
      return JSON.stringify([skyStudioSheet])
    }
  }

  formatters["sky-studio-abc"] = () => function(mn) {
    // 计算所有分母的最大公约数
    let lcm = 1
    mn.beats.forEach((it) => {
      lcm *= new Rate(it.rate.a * lcm, it.rate.b).simplify().b
    })
    const bpm = mn.bpm * lcm
    if (!Number.isSafeInteger(bpm)) throw EvalError("不安全的转换")
    let firstLine = `<DontCopyThisLine> ${bpm} ${mn.keyNote % 12} ${16} ${mn.author} ${mn.transcribedBy}`
    let secondLine = ""
    mn.beats.forEach((beat) => {
      beat.rate.a *= lcm
      const dotCount = beat.rate.simplify().a - 1
      if (dotCount < 0) return
      if (beat.tones.length) {
        beat.tones.forEach((it) => {
          const note = musicUtil.tet12ToBasicNote(it)
          if (note < 0 || note > 14) throw RangeError("无法转换的音符：" + note)
          secondLine += String.fromCharCode(Math.floor(note / 5) + 65) + ((note % 5) + 1)
        })
        secondLine += " "
        if (dotCount) secondLine += ". ".repeat(dotCount)
      } else {
        secondLine += ". ".repeat(dotCount + 1)
      }
    })
    return firstLine + "\n" + secondLine
  }

  formatters["fengxu-genshin-2"] = () => {
    const kl = new KeyLayout(
      "C2,D2,E2,F2,G2,A3,B3,C3,D3,E3,F3,G3,A4,B4,C4,D4,E4,F4,G4,A5,B5"
        .split(",")
        .map((it) => `{${it}}`),
      -7
    )

    return function(mn) {
      const hitActions = musicUtil.createHitActions(mn, kl)
      let content = ""

      hitActions.forEach((it) => {
        it.locations.forEach((it) => {
          content += kl.keys[it]
        })
        content += it.locations.length ? `<${it.postDelay}>` : it.postDelay + " "
      })
      return `parseGenshinImpactMusic("${mn.name}", "${content}", 2)\n`
    }
  }

  formatters["piano-wizard-yp"] = () => {
    const helper = {
      /**
       * 将十二平均律编译为音符字符串
       * @param {number} tet12
       * @return {string}
       */
      compileNote(tet12) {
        let octaveShift = Math.sign(tet12) * Math.floor(Math.abs(tet12) / 12)
        let tet12Rang = tet12 % 12
        if (tet12Rang < 0) {
          tet12Rang += 12
          octaveShift--
        }
        const isSemi = musicUtil.isSemitone(tet12Rang)
        if (isSemi) tet12Rang--
        const note = musicUtil.naturals.indexOf(tet12Rang) + 1
        if (note <= 0) return "0"
        let result = String(note)
        if (octaveShift === 1) result += "+"
        else if (octaveShift === -1) result += "-"
        else if (octaveShift > 0) result += "+" + octaveShift
        else if (octaveShift < 0) result += octaveShift
        if (isSemi) result += "#"
        return result
      },
      /**
       * @param {Beat} beat
       * @return {string}
       */
      formatBeat(beat) {
        let notes = beat.tones.map((it) => this.compileNote(it)).join("&") || "0"
        const { a, b } = beat.rate.simplify()
        if (a > 0) {
          if (a !== 1) notes += "*" + a
          if (b !== 1) notes += "/" + b
          return notes + ","
        }
        return ""
      }
    }

    return function(mn) {
      const pitchLevel = mn.keyNote % 12
      const isSemi = musicUtil.isSemitone(pitchLevel)
      const basePitch = musicUtil.naturals.indexOf(isSemi ? pitchLevel - 1 : pitchLevel)
      let baseNote = String.fromCharCode(basePitch < 5 ? 67 + basePitch : 60 + basePitch)
      if (isSemi) baseNote += "#"

      let content = `/**\n * name: ${mn.name}\n * author: ${mn.author}\n * arrangedBy: \n * transcribedBy: ${mn.transcribedBy}\n */\n[1=${baseNote},4/4,${mn.bpm}]\n`

      mn.beats.forEach((beat) => {
        content += helper.formatBeat(beat)
      })

      return content
    }
  }

  //</editor-fold>

  //<editor-fold desc="Parsers">

  parsers["sky-studio-json"] = () => {
    const helper = {
      checkSkyJSON(p) {
        const sheets = JSON.parse(p)
        if (!Array.isArray(sheets)) throw TypeError("格式错误")
        const skyJson = sheets[0]
        if (!skyJson) throw RangeError("文件内容为空")
        if (skyJson.isEncrypted) throw RangeError("不支持加密的 json 文件")
        return skyJson
      },
      checkSongNotes(p) {
        if (!Array.isArray(p)) throw TypeError("songNotes 必须为数组")
        return p
      },
      checkNoteTime(p) {
        if (!Number.isInteger(p)) throw TypeError("time 必须为整数")
        if (p < 0) throw RangeError("time 必须大于等于 0")
        return p
      },
      checkKeyIndex(p) {
        const key = parseInt(p)
        if (key >= 0 && key < 15) return key
        throw RangeError("未知键位: " + p)
      }
    }

    return function(str) {
      const skyJson = helper.checkSkyJSON(str)

      const mn = new MusicNotation(
        skyJson.name || "Unknown",
        skyJson.author || "",
        skyJson.transcribedBy || "",
        skyStudioUtil.checkPitchLevel(skyJson.pitchLevel),
        skyStudioUtil.checkBpm(skyJson.bpm)
      )
      const songNotes = helper.checkSongNotes(skyJson.songNotes)
      /** @type {{time: number, keys: number[]}[]} */
      const beats = Object.values(
        // 按时间分组，相同时间的 key 构成和弦
        langUtil.groupBy(songNotes, (it) => helper.checkNoteTime(it.time))
      ).map((arr) => {
        return {
          time: arr[0].time,
          keys: arr.map((it) => helper.checkKeyIndex(it.key.split("Key")[1]))
        }
      })
      langUtil.insertionSort(beats, (a, b) => a.time < b.time)

      let lastBeat = new Beat(new Rate(0, 60_000))
      beats.forEach((beat) => {
        lastBeat.rate.a = (beat.time - lastBeat.rate.a) * mn.bpm
        if (lastBeat.rate.a) mn.beats.push(lastBeat)
        lastBeat = new Beat(new Rate(beat.time, lastBeat.rate.b), beat.keys.map((it) => musicUtil.basicNoteTo12TET(it)))
      })
      lastBeat.rate.a = 4
      lastBeat.rate.b = 1
      mn.beats.push(lastBeat)
      return mn
    }
  }

  parsers["sky-studio-abc"] = () => {
    const helper = {
      /**
       * @param {string} [str]
       * @return {[string, string]}
       */
      checkLines(str) {
        str = str?.trim().replaceAll("\r\n", "\n").replaceAll("\r", "\n")
        if (!str) throw SyntaxError("文件内容为空")
        if (str.indexOf("<DontCopyThisLine>") < 0) throw SyntaxError("语法格式错误")
        const gtInd = str.indexOf(">")
        const lfInd = str.indexOf("\n", gtInd)
        if (lfInd < 0) throw SyntaxError("缺失换行符 '\\n'")
        const firstLine = str.substring(gtInd + 1, lfInd).trim()
        const rest = str.substring(lfInd + 1)
        return [firstLine, rest]
      },
      /**
       * @param {string} str
       * @return {MusicNotation}
       */
      parseInfo(str) {
        const infos = str.split(" ").filter((it) => it)
        const bpm = skyStudioUtil.checkBpm(parseInt(infos[0]))
        const pitchLevel = skyStudioUtil.checkPitchLevel(parseInt(infos[1]))
        return new MusicNotation("", infos[3], infos[4], pitchLevel, bpm)
      },
      /**
       * @param {number[]} notes
       * @param {Beat[]} beats
       * @param {number} dotCount
       */
      transferNotes(notes, beats, dotCount) {
        // notes 本身算作一个点
        const rateA = notes.length ? dotCount + 1 : dotCount
        if (!rateA) return
        // 此处需要清空 notes 数组
        beats.push(new Beat(new Rate(rateA), notes.splice(0, notes.length)))
      },
      errorAt(line, column) {
        throw SyntaxError(`解析错误 (行: ${line}, 列: ${column})`)
      }
    }
    return function(str) {
      const [infoLine, keysLine] = helper.checkLines(str)
      const mn = helper.parseInfo(infoLine)

      let dotCount = 0
      const notes = []
      let lineNumber = 2, lineIndex = -1
      for (let i = 0; i < keysLine.length; i++) {
        const ch = keysLine.charAt(i)
        if (ch === "\n") {
          lineIndex = i
          lineNumber++
          continue
        }
        if (ch === ".") {
          dotCount++
          continue
        }
        if (ch === " ") continue
        const cc = ch.charCodeAt(0) - 65
        // [A, C]
        if (cc >= 0 && cc <= 2) {
          helper.transferNotes(notes, mn.beats, dotCount)
          dotCount = 0
          let abc = -1
          for (; i < keysLine.length; i++) {
            const ch = keysLine.charAt(i)
            if (abc < 0) {
              const cc = ch.charCodeAt(0) - 65
              // [A, C]
              if (cc >= 0 && cc <= 2) abc = cc
              else {
                i--
                break
              }
            } else {
              const n = parseInt(ch)
              // [1, 5]
              if (n >= 1 && n <= 5) {
                notes.push(musicUtil.basicNoteTo12TET(abc * 5 + n - 1))
                abc = -1
              } else helper.errorAt(lineNumber, i - lineIndex)
            }
          }
          if (abc >= 0) helper.errorAt(lineNumber, i - lineIndex)
        } else helper.errorAt(lineNumber, i - lineIndex)
      }
      if (notes.length) helper.transferNotes(notes, mn.beats, Math.max(dotCount, 3))
      return mn
    }
  }

  // TODO
  parsers["fengxu-genshin-2"] = () => {
    return function(str) {
      // "250 {C2}<250>{D2}<500>{E2}<750>"
      throw RangeError("暂不支持")
    }
  }

  parsers["piano-wizard-yp"] = () => {
    const helper = {
      blockCommentRegex: new RegExp("/\\*[\\d\\D]*?\\*/", "g"),
      lineCommentRegex: new RegExp("//[^\\n]*", "g"),
      spaceCharRegex: new RegExp("\\s+", "g"),
      musicSyntaxRegex: new RegExp("^\\[1=([A-G][#b]?),\\d+/\\d+,(\\d+)](\\d(?:[-+#b]\\d*)*(?:&\\d(?:[-+#b]\\d*)*)*(?:[*/]\\d+)*(?:,\\d(?:[-+#b]\\d*)*(?:&\\d(?:[-+#b]\\d*)*)*(?:[*/]\\d+)*)*),?$"),
      musicBeatRegex: new RegExp("^([^*/]+)((?:[*/]\\d+)*)\$"),
      startsWithNumberRegex: new RegExp("^(\\d+)?(.*)$"),

      /**
       * 移除乐谱中的注释
       * @param {string} str
       * @return {string}
       */
      removeComment(str) {
        return str.replaceAll(this.blockCommentRegex, "")
          .replaceAll(this.lineCommentRegex, "")
          .replaceAll(this.spaceCharRegex, "")
      },
      /**
       * 校验乐谱语法
       * @param {string} str
       * @return {{keyNote: string, beats: string, bpm: number}}
       */
      checkMusicSyntax(str) {
        const matchArr = str.match(this.musicSyntaxRegex)
        if (!matchArr || matchArr.length < 4) throw SyntaxError("语法格式错误")
        return {
          keyNote: matchArr[1],
          bpm: parseInt(matchArr[2]),
          beats: matchArr[3]
        }
      },
      /**
       * 解析节拍
       * @param {string} str
       * @return {Beat}
       */
      parseBeat(str) {
        const matchArr = str.match(this.musicBeatRegex)
        if (!matchArr || matchArr.length < 3) throw SyntaxError("节拍语法格式错误")
        const tones = new Set(matchArr[1].split("&").map((it) => this.parseNote(it)).filter((it) => it !== null))
        return new Beat(this.parseRate(matchArr[2], new Rate()), Array.from(tones))
      },
      /**
       * 解析时值倍率
       * @param {string} str
       * @param {Rate} acc
       * @return {Rate}
       */
      parseRate(str, acc) {
        if (!str) return acc
        // *21/5  乘除后面的数字是必有的
        const rest = str.substring(1).match(this.startsWithNumberRegex)
        const n = parseInt(rest?.[1])
        if (n > 0) {
          const rate = str[0] === "/" ? new Rate(acc.a, acc.b * n) : new Rate(acc.a * n, acc.b)
          return this.parseRate(rest[2], rate)
        }
        throw RangeError("不支持的倍率值：" + str)
      },
      /**
       * 解析音符
       * @param {string} str
       * @return {number|null}
       */
      parseNote(str) {
        const note = parseInt(str[0])
        if (note >= 0 && note <= 7) {
          if (!note) return null
          // 这里减 1 使其变为从 0 开始，再转为十二平均律
          return musicUtil.basicNoteTo12TET(note - 1) + this.parseAccidental(str.substring(1), 0)
        }
        throw RangeError("不支持的音符：" + str[0])
      },
      /**
       * 解析变音记号
       * @param {string} str
       * @param {number} acc
       * @return {number}
       */
      parseAccidental(str, acc) {
        if (!str) return acc
        // +2b  表示升 2 个八度，降半调
        // -#2  表示降一个八度，升 2 个半调
        // 数字省略则为 1
        const rest = str.substring(1).match(this.startsWithNumberRegex)
        let n = rest?.[1]
        n = n ? parseInt(n) : 1
        if (n >= 0) {
          // 都用十二平均律来表示，所以升降八度是以 12 作倍数
          switch (str[0]) {
            case "+":
              n *= 12
              break
            case "-":
              n *= -12
              break
            case "b":
              n = -n
              break
          }
          return this.parseAccidental(rest?.[2], acc + n)
        }
        throw RangeError("不支持的升降调：" + str)
      }
    }

    return function(str) {
      const triple = helper.checkMusicSyntax(helper.removeComment(str))
      const key = triple.keyNote
      let keyNote = key.charCodeAt(0) - 67
      if (keyNote < 0) keyNote += 7 // 把 AB 移到 G 的后面
      keyNote = musicUtil.basicNoteTo12TET(keyNote) // 转为十二平均律
      switch (key[1]) {
        case "#":
          keyNote++
          break
        case "b":
          keyNote--
          break
      }
      const mn = new MusicNotation()
      mn.keyNote = keyNote
      mn.bpm = triple.bpm
      mn.beats = triple.beats.split(",").filter((it) => it).map((it) => helper.parseBeat(it))
      return mn
    }
  }

  //</editor-fold>

  function MusicFormatter(label) {
    checkConstructor(this, MusicFormatter)
    const createFormatHandler = formatters[label]
    if (!createFormatHandler) unknownFormat(label)
    this.format = createFormatHandler()
    this.label = label
  }

  MusicFormatter.formatters = Object.freeze(Object.keys(formatters))

  function MusicParser(label) {
    checkConstructor(this, MusicParser)
    const createParseHandler = parsers[label]
    if (!createParseHandler) unknownFormat(label)
    this.parse = createParseHandler()
    this.label = label
  }

  MusicParser.parsers = Object.freeze(Object.keys(parsers))

  if (!global["MusicFormatter"]) global["MusicFormatter"] = MusicFormatter
  if (!global["MusicParser"]) global["MusicParser"] = MusicParser

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      MusicFormatter: global["MusicFormatter"],
      MusicParser: global["MusicParser"]
    }
  }
}(this || {}))
