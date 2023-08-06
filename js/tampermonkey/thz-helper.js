// ==UserScript==
// @name         thz-helper
// @description  thz forum helper
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @author       paso
// @match        http://96thz.cc/*
// @match        http://www.example.com/
// @grant        none
// @license      MIT
// ==/UserScript==

;(function () {
  'use strict'
  // Your code here...
  // http://96thz.cc/forum.php?mod=forumdisplay&fid=181&filter=typeid&typeid=36&orderby=heats&page=2

  const namespace = 'paso-thz-helper'
  const __msgType = `${namespace}-cross-origin-storage`
  const middleware = 'http://www.example.com'
  if (window.location.origin === middleware) {
    StorageServer()
  } else {
    handleTarget(middleware)
  }

  function handleTarget(server) {
    const CONTEXT = {
      env: 'prod',
      dev: {
        dependency: {
          jquery: 'http://localhost:3000/test/jquery.slim.min.js',
          popupInject: 'http://localhost:3000/test/popup-inject.min.js',
          vue: 'http://localhost:3000/test/vue.global.prod.min.js'
        }
      },
      prod: {
        dependency: {
          jquery: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.slim.min.js',
          popupInject: 'https://fastly.jsdelivr.net/gh/pansong291/js-lib@v1.0.3/src/popup-inject.min.js',
          vue: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/vue/3.2.31/vue.global.prod.min.js'
        }
      }
    }
    const DEFAULT_DATA = function () {
      return {
        executeSelector: '#discuz_tips',
        path: '/forum.php',
        params: {
          fid: '181',
          filter: 'typeid',
          typeid: '',
          orderby: 'heats'
        },
        search: ''
      }
    }
    const storage = StorageClient(server)
    const querySearch = resolveQuerySearch()
    const hiddenSelector = {
      forumdisplay:
        '.a_fl, .a_fr, #toptb + div[align=center], #diynavtop, #toptb, #hd, #ft, #f_pst, #newspecial, #autopbn',
      viewthread:
        '.a_fl, .a_fr, #toptb + div[align=center], #diynavtop, #toptb, #hd, #ft, #f_pst, #newspecial, #pgt, .pgt, .pgbtn, #hiddenpoststip, #postlist > div[id] + div[id], .pgs',
      index:
        '.a_fl, .a_fr, #toptb + div[align=center], #diynavtop, #toptb, #hd, #ft, #f_pst, #newspecial, #autopbn, #ct > .mn > style + div, #ct > .mn > div + table'
    }

    const POPUP_INJECT_CONFIG = {
      namespace,
      actionName: 'Settings',
      collapse: '70%',
      location: '35%',
      content: `<div id="${namespace}-app"></div>`,
      style: `
  <style>
  .${namespace} * {
      font-size: 14px;
      color: black;
  }
  .${namespace} .table {
      display: table;
      border-collapse: separate;
      border-spacing: 4px 4px;
  }
  .${namespace} .table-row {
      display: table-row;
  }
  .${namespace} .table-cell {
      display: table-cell;
  }
  .${namespace} .text-right {
      text-align: right;
  }
  .${namespace} .flex.gap-8 {
      gap: 8px;
  }
  </style>`
    }

    const VUE_COMPONENT_PARAM_SELECT = {
      template: `
  <label class="table-row">
      <div class="table-cell text-right">{{title}}</div>
      <div class="table-cell">
          <div class="flex">
            <input class="input monospace" v-if="!hideInput" v-model.trim="inputValue" />
            <select class="input" v-if="!hideSelect" v-model="inputValue">
                <option v-for="o in options" :value="o.value">{{o.label}}</option>
            </select>
          </div>
      </div>
  </label>`,
      props: ['title', 'value', 'options', 'hideInput', 'hideSelect'],
      emits: ['update:value'],
      computed: {
        inputValue: {
          get() {
            return this.$props.value
          },
          set(v) {
            this.$emit('update:value', v)
          }
        }
      }
    }

    const VUE_APP_CONFIG = {
      template: `
  <div class="flex col gap-8">
      <div class="table">
          <SelectFormItem title="执行时机" v-model:value="executeSelector" hideSelect="true" />
          <SelectFormItem title="path" v-model:value="path" hideSelect="true" />
          <SelectFormItem title="板块" v-model:value="params.fid" :options="forms.fidOptions" />
          <SelectFormItem title="筛选" v-model:value="params.filter" :options="forms.filterOptions" hideInput="true" />
          <SelectFormItem title="系列" v-if="params.filter === 'typeid'" v-model:value="params.typeid" :options="forms.typeidOptions[params.fid]" />
          <SelectFormItem title="排序" v-model:value="params.orderby" :options="forms.orderbyOptions" hideInput="true" />
          <SelectFormItem title="搜索" v-model:value="search" hideSelect="true" />
      </div>
      <button class="button" @click="apply">应用</button>
  </div>`,
      components: {
        SelectFormItem: VUE_COMPONENT_PARAM_SELECT
      },
      data() {
        return {
          ...DEFAULT_DATA(),
          forms: {
            fidOptions: [
              { value: '181', label: '亚洲無碼原創' },
              { value: '220', label: '亚洲有碼原創' },
              { value: '182', label: '欧美無碼' },
              { value: '69', label: '国内原创(BT)' },
              { value: '203', label: '各类合集资源' },
              { value: '177', label: '蓝光高清原盘' },
              { value: '39', label: '日韩情色(BT)' },
              { value: '172', label: '桃花原創合集（BT）' }
            ],
            filterOptions: [{ value: 'typeid', label: '系列' }],
            typeidOptions: {
              181: [
                { value: '', label: '全部' },
                { value: '664', label: 'FC2PPV' },
                { value: '33', label: '美女步兵' },
                { value: '35', label: '一本道系' },
                { value: '36', label: '加勒比系' },
                { value: '64', label: '1919go' },
                { value: '39', label: '10musu' },
                { value: '47', label: '性孽變態' },
                { value: '53', label: '素人系列' },
                { value: '37', label: '东京热系' },
                { value: '38', label: 'HEYZO' },
                { value: '116', label: 'MuraTV' },
                { value: '67', label: 'HeYPPV' },
                { value: '50', label: '仟人斬系' },
                { value: '51', label: '金髪天國' },
                { value: '52', label: '盜撮系列' },
                { value: '49', label: 'ガチん娘' },
                { value: '40', label: '人妻熟女' },
                { value: '319', label: 'pacoma' },
                { value: '195', label: '無毛宣言' },
                { value: '194', label: 'メス豚系' },
                { value: '226', label: 'RealDiva' },
                { value: '114', label: 'XXX-AV' },
                { value: '196', label: '誘惑天国' },
                { value: '198', label: '经典稀缺' },
                { value: '200', label: '問答無用' },
                { value: '44', label: 'JavHD' },
                { value: '321', label: 'h4610系' },
                { value: '322', label: '素人妻系' },
                { value: '320', label: '人妻斬系' },
                { value: '501', label: 'AV志向系' },
                { value: '616', label: '店長推薦' },
                { value: '731', label: '本生素人' },
                { value: '48', label: '3D影畫' },
                { value: '523', label: 'H:G:M:O' },
                { value: '222', label: '写真专辑' },
                { value: '768', label: '无码流出' },
                { value: '770', label: '麻豆传媒' }
              ],
              220: [
                { value: '', label: '全部' },
                { value: '91', label: '高清騎兵' },
                { value: '92', label: '美女騎兵' },
                { value: '109', label: '美素人系' },
                { value: '110', label: '剧情系列' },
                { value: '221', label: '无损原盘' }
              ],
              182: [
                { value: '', label: '全部' },
                { value: '41', label: 'x-Art' },
                { value: '42', label: 'Wow' },
                { value: '43', label: 'bangbros' },
                { value: '45', label: 'brazzers' },
                { value: '120', label: 'naughtyamerica' },
                { value: '122', label: 'babes' },
                { value: '46', label: 'realitykings' },
                { value: '115', label: 'DDF' },
                { value: '111', label: '按摩师系' },
                { value: '214', label: 'twistys' },
                { value: '121', label: 'nubilefilms' },
                { value: '197', label: 'hegre-art' },
                { value: '227', label: 'wicked' },
                { value: '150', label: 'BDSM' },
                { value: '216', label: '邪惡天使' },
                { value: '219', label: 'vixen' },
                { value: '220', label: 'passion-hd' },
                { value: '223', label: '18yoga' },
                { value: '224', label: 'private' },
                { value: '193', label: 'joymii' },
                { value: '201', label: '21members' },
                { value: '202', label: 'colette' },
                { value: '213', label: 'mofos' },
                { value: '215', label: 'nubiles' },
                { value: '217', label: 'blacked' },
                { value: '225', label: 'sexart' },
                { value: '199', label: 'Femjoy' },
                { value: '228', label: 'digitalplayground' },
                { value: '496', label: '18xgirls' },
                { value: '497', label: 'teamskeet' },
                { value: '498', label: 'sexyhub' },
                { value: '499', label: 'fakehub' },
                { value: '500', label: 'realitygang' },
                { value: '218', label: 'julesjordan' },
                { value: '513', label: 'TUSHY' },
                { value: '605', label: 'ANALIZED' },
                { value: '615', label: 'HARDX' },
                { value: '730', label: 'nubiles-porn' },
                { value: '732', label: 'lubed' },
                { value: '769', label: 'deeper' },
                { value: '87', label: 'SM变态' },
                { value: '88', label: '其它分类' },
                { value: '86', label: '肛交天堂' }
              ],
              69: [
                { value: '', label: '全部' },
                { value: '9', label: '国内无码' },
                { value: '10', label: '国内偷拍' },
                { value: '11', label: '主播探花' },
                { value: '65', label: '美女资源' },
                { value: '192', label: '国模私拍' }
              ],
              203: [
                { value: '', label: '全部' },
                { value: '55', label: '亚洲无码' },
                { value: '56', label: '亚洲有码' },
                { value: '57', label: '欧美情色' },
                { value: '63', label: '其他资源' }
              ],
              177: [
                { value: '', label: '全部' },
                { value: '27', label: '亚洲无码' },
                { value: '28', label: '亚洲有码' },
                { value: '29', label: '欧美情色' },
                { value: '30', label: '其他原盘' }
              ],
              39: [
                { value: '', label: '全部' },
                { value: '1', label: '无码' },
                { value: '2', label: '有码' }
              ],
              172: [
                { value: '', label: '全部' },
                { value: '18', label: '亚洲无码' },
                { value: '19', label: '亚洲有码' },
                { value: '20', label: '中文字幕' },
                { value: '21', label: '欧美情色' },
                { value: '22', label: '伦理电影' },
                { value: '23', label: '美女写真' },
                { value: '24', label: '成人动漫' }
              ]
            },
            orderbyOptions: [
              { value: 'heats', label: '最热' },
              { value: 'lastpost', label: '最新' },
              { value: 'dateline', label: '时间' }
            ]
          }
        }
      },
      computed: {},
      methods: {
        apply() {
          storage
            .setItem(namespace, {
              executeSelector: this.executeSelector,
              path: this.path,
              params: {
                ...this.params
              },
              search: this.search
            })
            .then(() => (window.location = getPageLocation(this.path, this.params, querySearch.page || '1')))
        }
      },
      mounted() {
        storage
          .getItem(namespace)
          .then((resp) => JSON.parse(resp.data))
          .catch(() => DEFAULT_DATA())
          .then((data) => {
            this.executeSelector = data.executeSelector
            this.path = data.path
            this.params.fid = data.params.fid
            this.params.filter = data.params.filter
            this.params.typeid = data.params.typeid
            this.params.orderby = data.params.orderby
            this.search = data.search
          })
      }
    }

    const dependency = CONTEXT[CONTEXT.env].dependency
    const window$ = window.$
    loadJS(dependency.jquery)
      .then(() => {
        window.$ = window$
      })
      .then(() => loadJS(dependency.popupInject))
      .then(() => loadJS(dependency.vue))
      .then(() => window.paso.injectPopup(POPUP_INJECT_CONFIG))
      .then(() => window.Vue.createApp(VUE_APP_CONFIG).mount(`#${namespace}-app`))

    storage
      .getItem(namespace)
      .then((resp) => JSON.parse(resp.data))
      .catch((e) => {
        return DEFAULT_DATA()
      })
      .then((data) =>
        ready(data.executeSelector)
          .then(() => handlePageContent(data))
          .catch((e) => {
            console.warn(e)
          })
      )

    function handlePageContent(data) {
      // 隐藏广告
      const list = document.querySelectorAll(hiddenSelector[querySearch.mod || 'index'])
      list?.forEach((el) => {
        el.setAttribute('style', 'display: none !important;')
      })
      // 替换分页
      const { path, params, search } = data
      document.querySelectorAll('#fd_page_bottom > .pg, #fd_page_top > .pg')?.forEach((pw) => {
        const strong = pw.querySelector('strong')
        let currentPage = 1
        if (strong) {
          currentPage = getStartInt(strong.innerText)
        }
        pw.querySelectorAll('a[href]')?.forEach((page) => {
          const pageNum = getEndInt(page.innerText)
          if (isNaN(pageNum)) {
            if (page.classList.contains('prev')) {
              page.href = getPageLocation(path, params, currentPage - 1)
            } else if (page.classList.contains('nxt')) {
              page.href = getPageLocation(path, params, currentPage + 1)
            }
          } else {
            page.href = getPageLocation(path, params, pageNum)
          }
        })
        const pageInput = pw.querySelector('input[name=custompage]')
        if (pageInput) {
          pageInput.onkeydown = function (event) {
            if (event.keyCode === 13) {
              window.location = getPageLocation(path, params, this.value)
              window.doane?.(event)
            }
          }
        }
      })
      // 过滤结果
      const notMatch = []
      const match = (t) => {
        return t && t.indexOf && t.indexOf(search) >= 0
      }
      document.querySelectorAll('#threadlisttableid > tbody')?.forEach((item) => {
        if (!match(item.querySelector('a.s.xst')?.innerText)) {
          notMatch.push(item)
        }
      })
      const setFilter = (filter) => {
        notMatch.forEach((item) => {
          if (filter) {
            item.setAttribute('style', 'display: none !important;')
          } else {
            item.removeAttribute('style')
          }
        })
      }
      // 增加过滤按钮
      const tf = document.querySelector('#threadlist .tf')
      if (tf) {
        let filterCb = tf.querySelector(`label input.${namespace}`)
        if (!filterCb) {
          filterCb = document.createElement('input')
          filterCb.classList.add(namespace)
          filterCb.type = 'checkbox'
          const label = document.createElement('label')
          label.append(filterCb, document.createTextNode('只看搜索结果'))
          tf.append(document.createTextNode('\xA0'), label)
        }
        filterCb.checked = !!search
        if (search) setFilter(true)
        filterCb.onchange = (e) => {
          setFilter(e.target.checked)
        }
      }
    }

    if (CONTEXT.env === 'dev') {
      window._$_getTypes = function () {
        const arr = []
        document.querySelectorAll('ul#thread_types > li > a')?.forEach((a) => {
          const item = { value: '' }
          if (a.firstChild && a.firstChild instanceof Text) {
            item.label = a.firstChild.wholeText
          }
          if (a.href) {
            const i = a.href.indexOf('?')
            if (i >= 0) {
              const qs = resolveQuerySearch(a.href.substring(i))
              item.value = qs.typeid || ''
            }
          }
          arr.push(item)
        })
        console.log(arr)
        console.log(JSON.stringify(arr))
      }
    }
  }

  function resolveQuerySearch(search) {
    const result = {}
    search = search || window.location.search
    if (search) {
      if (search.startsWith('?')) {
        search = search.substring(1)
      }
      search
        .split('&')
        .map((entry) => {
          return entry.split('=')
        })
        .forEach((entry) => {
          result[entry[0]] = entry[1]
        })
    }
    return result
  }

  function loadJS(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      document.head.append(script)
    })
  }

  function ready(selector, interval = 300, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const loopId = setInterval(
        (startTime) => {
          if (document.querySelector(selector)) {
            clearInterval(loopId)
            resolve()
          } else {
            if (Date.now() - startTime > timeout) {
              clearInterval(loopId)
              reject(`look up for target '${selector}' timeout: ${timeout}ms`)
            }
          }
        },
        interval,
        Date.now()
      )
    })
  }

  function getStartInt(str) {
    let result = ''
    if (str) {
      for (let i = 0; i < str.length; i++) {
        if (isNaN(parseInt(str[i]))) {
          if (result) break
        } else {
          result += str[i]
        }
      }
    }
    return parseInt(result)
  }

  function getEndInt(str) {
    let result = ''
    if (str) {
      for (let i = str.length - 1; i >= 0; i--) {
        if (isNaN(parseInt(str[i]))) {
          if (result) break
        } else {
          result = str[i] + result
        }
      }
    }
    return parseInt(result)
  }

  function getPageLocation(path, p, num) {
    const params = {
      mod: 'forumdisplay',
      fid: p.fid || '',
      filter: p.filter || '',
      typeid: p.typeid || '',
      orderby: p.orderby || '',
      page: num
    }
    const paramStr =
      '?' +
      Object.entries(params)
        .map((entry) => {
          return `${entry[0]}=${entry[1]}`
        })
        .join('&')
    return path + paramStr
  }

  /**
   * 生成随机ID
   */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function StorageClient(middlewareUrl) {
    const _requests = {} //所有请求消息数据映射
    const _cache = {
      ready: false,
      queue: []
    }
    //获取 iframe window 对象
    const _iframeWin = _createIframe(middlewareUrl).contentWindow
    _initListener() //监听

    /**
     * 创建 iframe 标签
     * @param {string} middlewareUrl
     * @return Object
     */
    function _createIframe(middlewareUrl) {
      const iframe = document.createElement('iframe')
      iframe.src = middlewareUrl
      iframe.setAttribute('style', 'display: none !important;')
      window.document.body.appendChild(iframe)
      return iframe
    }

    /**
     * 初始化监听函数
     */
    function _initListener() {
      // 监听 iframe “中转页面”返回的消息
      window.addEventListener('message', (e) => {
        if (e?.data?.__msgType !== __msgType) return
        if (e.data.ready) {
          _cache.ready = true
          while (_cache.queue.length) {
            _iframeWin.postMessage(_cache.queue.shift(), '*')
          }
          return
        }
        let { id, response } = e.data

        // 找到“中转页面”的消息对应的回调函数
        let currentCallback = _requests[id]
        if (!currentCallback) return
        // 调用并返回数据
        currentCallback(response, e.data)
        delete _requests[id]
      })
    }

    /**
     * 发起请求函数
     * @param method 请求方式
     * @param key
     * @param value
     */
    function _requestFn(method, key, value) {
      return new Promise((resolve) => {
        // 发消息时，请求对象格式
        const req = {
          id: uuid(),
          method,
          key,
          value,
          __msgType
        }

        //请求唯一标识 id 和回调函数的映射
        _requests[req.id] = resolve

        if (_cache.ready) {
          _iframeWin.postMessage(req, '*')
        } else {
          _cache.queue.push(req)
        }
      })
    }

    return {
      /**
       * 获取存储数据
       * @param {Object | string} key
       */
      getItem(key) {
        return _requestFn('get', key)
      },
      /**
       * 更新存储数据
       * @param {Object | string} key
       * @param {Object | string} value
       */
      setItem(key, value) {
        return _requestFn('set', key, value)
      },
      /**
       * 删除数据
       * @param {Object | string} key
       */
      delItem(key) {
        return _requestFn('delete', key)
      },
      /**
       * 清除数据
       */
      clear() {
        return _requestFn('clear')
      }
    }
  }

  function StorageServer() {
    if (window.parent === window) return
    const functionMap = {
      /**
       * 设置数据
       * @param {Object | string} key
       * @param {?Object | ?string} value
       */
      setStore(key, value) {
        if (!key) return
        if (typeof key === 'string') {
          return localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value)
        }
        Object.keys(key).forEach((dataKey) => {
          let dataValue = typeof key[dataKey] === 'object' ? JSON.stringify(key[dataKey]) : key[dataKey]
          localStorage.setItem(dataKey, dataValue)
        })
      },

      /**
       * 获取数据
       * @param {Object | string} key
       */
      getStore(key) {
        if (!key) return
        if (typeof key === 'string') return localStorage.getItem(key)
        let dataRes = {}
        Object.keys(key).forEach((dataKey) => {
          dataRes[dataKey] = localStorage.getItem(dataKey) || null
        })
        return dataRes
      },

      /**
       * 删除数据
       * @param {Object | string} key
       */
      deleteStore(key) {
        if (!key) return
        if (typeof key === 'string') return localStorage.removeItem(key)
        Object.keys(key).forEach((dataKey) => {
          localStorage.removeItem(dataKey)
        })
      },

      /**
       * 清空
       */
      clearStore() {
        localStorage.clear()
      }
    }

    _initListener() //监听消息

    // 通知父页面
    window.parent.postMessage(
      {
        ready: true,
        __msgType
      },
      '*'
    )

    /**
     * 监听
     */
    function _initListener() {
      window.addEventListener('message', (e) => {
        if (e?.data?.__msgType !== __msgType) return
        const { method, key, value, id = 'default' } = e.data

        //获取方法
        const func = functionMap[`${method}Store`]

        //取出本地的数据
        const response = {
          data: func?.(key, value)
        }
        if (!func) response.errorMsg = 'Request method error!'

        //发送给父页面
        window.parent.postMessage(
          {
            id,
            request: e.data,
            response,
            __msgType
          },
          '*'
        )
      })
    }
  }
})()
