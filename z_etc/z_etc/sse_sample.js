import { ButtonGrid, ButtonToggleColShowHidden, IconHistoryStatus, ButtonMuiStd } from "components/common/Button";
import ButtonIconRetry from "components/common/Button/ButtonIconRetry";
import useMessage from "hooks/useMessage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openPopup, reloadPopup } from "store/popupSlice";
import { GridPage } from "components/common/Grid";
import PopupHistoryDetail from "../popup/PopupHistoryDetail";
import PopupHistoryRetry from "../popup/PopupHistoryRetry";
import { requestCollectRetry } from "api/modules/collect/historyApi";

export const agGridLinkRender = ( props ) => {
  const btnClickHandler = (e) => {
    window.open(props.value);
  };
  return (
    <div>
      <ButtonGrid onClick={btnClickHandler} label="LOG"></ButtonGrid>
    </div>
  )
}

export const gridRetryBtnRender = ( props, confirm, alert, interfaceType, actionAuth ) => {
  const confirmRetry = () => {
    const selectedList = [JSON.parse(JSON.stringify(props.data))];
    let existRetryCnt = 0;
    let confirmMsg = "재처리 하시겠습니까?";
    selectedList.forEach(o => {
      if (o.retry === "1") {
        existRetryCnt++;
      }
    });
    if (existRetryCnt > 0) {
      confirmMsg = "선택 하신 건은 재처리 중 입니다.\n해당 사항을 무시하고 " + confirmMsg;
    }
    confirm(confirmMsg, btnClickHandler);
  }

  const btnClickHandler = () => {
    const selectedList = [JSON.parse(JSON.stringify(props.data))];

    let valid = { isValid: true, msg: "", count: 0 };
    selectedList.forEach(o => {
      const tmp = o.interface_id;
      if (o.protocol_cd === null || o.protocol_cd === undefined) {
        valid.isValid = false;
        valid.count = valid.count + 1;
        if (valid.count < 6) {
          valid.msg = valid.msg + "인터페이스ID '" + tmp  + "' 에 해당 하는 PROTOCOL이 존재 하지 않습니다.\n";
        }
      }
    });
    if (!valid.isValid) {
      if (valid.count > 5) {
        valid.msg = valid.msg + "\n(최대 5건만 출력 됩니다.)"
      }
      const msg = "다음과 같은 사유로 재처리 작업을 취소 합니다.\n" + valid.msg;
      alert(msg);
      return;
    };

    const param = {
      interfaceType: interfaceType,
      selectedList: selectedList
    }
    requestCollectRetry(param)
      .then(response => response.data)
      .then((ret) => {
        if (ret.rs !== undefined) return;
      });
  };

  const isCellDisabled = () => {
    let ret = !actionAuth.write;
    if (props.data.protocol_cd === 'DISTCP') ret = true;
    // 스케쥴 유형 'OD'일 경우 추후 변경 될 소지는 있으나 현재는 재처리 없음.
    if (props.data.interface_cycle === 'OD') ret = true;
    return ret;
  };

  return (
    <div>
      { (props.data.retry === '0' && props.data.retry_count * 1 === 0 ) && <ButtonIconRetry retryButtonType="PlayFilled" size="small" color="#12ca4c"  fontSize="small" disabled={isCellDisabled()} onClick={ confirmRetry } /> }
      { (props.data.retry === '0' && props.data.retry_count * 1 > 0 ) && <ButtonIconRetry retryButtonType="PlayOutline" size="small" color="#42a6fd"  fontSize="small" disabled={isCellDisabled()} onClick={ confirmRetry } /> }
      { (props.data.retry === '1') && <ButtonIconRetry retryButtonType="Loop" size="small" color="#cd50ca" fontSize="small" disabled={isCellDisabled()} onClick={ confirmRetry } /> }
    </div>
  )
}

export const statusCellRender = ( interfaceType, props ) => {
  return (
    <IconHistoryStatus histId={interfaceType === "collect" ? props.data.collect_hist_id : props.data.provide_hist_id } statusCd={ props.data.status_cd } statusNm={ props.data.status_nm } />
  );
};

const HistoryGrid = ({ interfaceType, historyData, usePagination, searchType, pagePerCount, setPagePerCount, onClickPageBtn, columnDefs, setColumnDefs, actionAuth, windowSize }) => {
  const userInfo = useSelector((state) => state.user);
  const [selectedData, setSelectedData] = useState([]);
  const gridCurrApiRef = useRef({});
  const { confirm, alert } = useMessage();
  const historyDataRef = useRef([]);
  const [isShowInterfaceInfoColumn, setIsShowInterfaceInfoColumn] = useState(false);
  const [isShowHistIdColumn, setIsShowHistIdColumn] = useState(false);
  const [isShowErrMsgColumn, setIsShowErrMsgColumn] = useState(false);
  const [isShowProvideInfoColumn, setIsShowProvideInfoColumn] = useState(false);
  const selectedHistIdRef = useRef("");
  const selectedHistDataRef = useRef({});
  const selectedOpenPopupRef = useRef("");
  const { isShow } = useSelector((state) => state.popup);
  const popupIsShowRef = useRef(false);
  const divGridRef = useRef(null);

  const dispatch = useDispatch();

  const isRowSelectable = useMemo(() => {
    return (params) => {
      let ret = true;
      // return !!params.data && params.data.retry === '0';
      if (params.data.protocol_cd === 'DISTCP') ret = false;
      // 스케쥴 유형 'OD'일 경우 추후 변경 될 소지는 있으나 현재는 재처리 없음.
      if (params.data.interface_cycle === 'OD') ret = false;
      return ret;
    };
  }, []);

  const numberSort = (num1, num2) => {
    return num1 - num2;
  };

  const [currColumnDefs, setCurrColumnDefs] = useState([
    { 
      headerName: '선택',
      children: [
        {
          headerName: '',
          field: "check",
          width: 50,
          suppressSizeToFit: true,
          headerCheckboxSelection: true,
          checkboxSelection: true,
          showDisabledCheckboxes: true,
          pinned: 'left',
          cellStyle: { marginLeft: '4px' },
          headerClass: 'header-checkbox-marginleft4',
          resizable: false
        }
      ]
    },
    { 
      headerName: '인터페이스',
      children: [
        {headerName: 'ID', field: "interface_id", width: 200, suppressSizeToFit: true, pinned: 'left', tooltipField: "interface_id"},
      ]
    },
    { 
      headerName: '이력',
      children: [
        {headerName: 'ID', field: "collect_hist_id", width: 220, suppressSizeToFit: true, pinned: 'left', hide: !isShowHistIdColumn },
      ]
    },
    { 
      headerName: '결과',
      children: [
        {headerName: '상태', field: "status_nm", cellStyle: {textAlign: 'center'}, width: 60, suppressSizeToFit: true, pinned: 'left', tooltipField: "err_msg", resizable: false, cellRenderer: (props) => { return statusCellRender(interfaceType, props) }},
        {headerName: 'Error Message', field: "err_msg", width: 120, suppressSizeToFit: true, pinned: 'left', tooltipField: "err_msg", cellStyle: {color: '#db6061'}, hide: !isShowErrMsgColumn},  /* #e35151 */
      ]
    },
    {headerName: '처리시간',
      children: [
        {headerName: '시작', field: "started_at", cellStyle: {textAlign: 'center'}, width: 140, suppressSizeToFit: true, pinned: 'left', tooltipField: "started_at"},
        {headerName: '종료', field: "ended_at", cellStyle: {textAlign: 'center'}, width: 140, suppressSizeToFit: true, pinned: 'left', tooltipField: "ended_at"},
      ]
    },
    {headerName:'수집 정보',
      children: [
        {headerName: 'NMS', field: "system_nm", cellStyle: {textAlign: 'center'}, width: 120,  suppressSizeToFit: true, hide: !isShowInterfaceInfoColumn},
        {headerName: '인터페이스명', field: "interface_nm", cellStyle: {textAlign: 'center'}, width: 120,  suppressSizeToFit: true, hide: !isShowInterfaceInfoColumn},
        {headerName: 'PROTOCOL', field: "protocol_cd", cellStyle: {textAlign: 'center'}, width: 90, suppressSizeToFit: true, hide: !isShowInterfaceInfoColumn},
        {headerName: '수집 주기', field: "interface_cycle_nm", cellStyle: {textAlign: 'center'}, width: 80, suppressSizeToFit: true, hide: !isShowInterfaceInfoColumn},
      ]
    },
    {headerName: '처리파일 정보',
      children: [
        {headerName: '로컬경로', field: "local_path", width: 220,  suppressSizeToFit: true, tooltipField: "local_path"},
        {headerName: '최종수집경로', field: "dest_path", width: 220,  suppressSizeToFit: true, tooltipField: "dest_path"},
        {headerName: '파일명', field: "filenm", width: 200,  suppressSizeToFit: true, tooltipField: "filenm"},
        {
          headerName: 'SIZE',
          field: "file_size",
          cellStyle: {textAlign: 'right'},
          valueFormatter: '(value * 1).toLocaleString()',
          width: 100,
          sortable: true,
          tooltipField: "file_size",
          comparator: numberSort
        },
      ]
    },
    {headerName: 'TASK',
      children: [
        {headerName: 'HOST', field: "host_nm", width: 100,  suppressSizeToFit: true, tooltipField: "host_nm",},
        {columnGroupShow: 'closed', headerName: 'LOG URL', field: "task_log_url", cellStyle: {textAlign: 'center'}, width: 100, suppressSizeToFit: true, cellRenderer: agGridLinkRender, hide: (userInfo.admin_lv !== '1')}
      ]
    },
    
    /* */
    /* Provide Info */
    /* */
    {headerName: '제공 인터페이스 정보',
      children: [
        {headerName: '인터페이스', field: "provide_interface_id", cellStyle: {textAlign: 'left'}, width: 200, suppressSizeToFit: true, tooltipField: "provide_interface_id", hide: !isShowProvideInfoColumn },
        {headerName: '인터페이스명', field: "provide_interface_nm", cellStyle: {textAlign: 'left'}, width: 200, suppressSizeToFit: true, tooltipField: "provide_interface_nm", hide: !isShowProvideInfoColumn },
        {headerName: 'PROTOCOL', field: "provide_protocol_cd", cellStyle: {textAlign: 'center'}, width: 100, suppressSizeToFit: true, tooltipField: "provide_protocol_cd", hide: !isShowProvideInfoColumn},
        /* {headerName: 'DESC', field: "provide_detail_desc", cellStyle: {textAlign: 'left'}, width: 250, suppressSizeToFit: true, tooltipField: "provide_detail_desc", hide: !isShowProvideInfoColumn}, */
        {headerName: 'DESC', field: "provide_desc", cellStyle: {textAlign: 'left'}, width: 250, suppressSizeToFit: true, tooltipField: "provide_desc", hide: !isShowProvideInfoColumn},
        {headerName: 'DB', field: "provide_db", cellStyle: {textAlign: 'left'}, width: 100, suppressSizeToFit: true, tooltipField: "provide_db", hide: !isShowProvideInfoColumn},
        {headerName: 'TB', field: "provide_tb", cellStyle: {textAlign: 'left'}, width: 150, suppressSizeToFit: true, tooltipField: "provide_tb", hide: !isShowProvideInfoColumn},
        {headerName: '동작방식', field: "provide_run_by", cellStyle: {textAlign: 'center'}, width: 100, suppressSizeToFit: true, tooltipField: "provide_run_by", hide: !isShowProvideInfoColumn},
        {headerName: '처리방향', field: "provide_provided_to", cellStyle: {textAlign: 'center'}, width: 100, suppressSizeToFit: true, tooltipField: "last_started_by", hide: !isShowProvideInfoColumn},
      ]
    },
    /* */
    /* Provide Info */
    /* */

    {headerName: '재처리',
      children: [
        {headerName: '재처리_FLAG', field: "retry", cellStyle: {textAlign: 'center'}, width: 100, suppressSizeToFit: true, hide: true},
        {headerName: '진행자', field: "last_started_by", cellStyle: {textAlign: 'center'}, width: 100, suppressSizeToFit: true, tooltipField: "last_started_by"},
        {headerName: '처리', field: "retry_desc", cellStyle: {textAlign: 'center'}, width: 70, suppressSizeToFit: true, tooltipField: "retry_desc", cellRenderer: (props) => { return gridRetryBtnRender(props, confirm, alert, interfaceType, actionAuth) } },
        {headerName: '처리건수', field: "retry_count", cellStyle: {textAlign: 'right'}, width: 80, suppressSizeToFit: true, sortable: true, tooltipField: "retry_count", comparator: numberSort },
      ]
    }
  ]);
  
  const confirmRetry = () => {
    const selectedList = JSON.parse(JSON.stringify(selectedData));
    let existRetryCnt = 0;
    let confirmMsg = "재처리 하시겠습니까?";
    selectedList.forEach(o => {
      if (o.retry === "1") {
        existRetryCnt++;
      }
    });
    if (selectedData.length === 0) {
      alert('선택된 건이 없습니다.\n(Ctrl+마우스 클릭으로 다중 선택 할 수 있습니다.)');
      return;
    }
    if (existRetryCnt > 0) {
      confirmMsg = "선택 하신 내용 중에 재처리 중인 건이 " + existRetryCnt + "건 있습니다.\n해당 사항을 무시하고 " + confirmMsg;
    }
    confirm(confirmMsg, reqRetryMulti)
  }

  const distinctList = (selectedList) => {
    // provide 정보와 연계로 화면 LIST에서 hist_id 중복인 경우가 발생 (hist_id : provide_interface_id = 1 : N)
    // hist_id 기준으로 중복 제거
    const ret = selectedList.filter((histdata, idx) => {
      return (
        selectedList.findIndex((histdatacomp) => {
          return histdata.collect_hist_id === histdatacomp.collect_hist_id
        }) === idx
      );
    });
    return ret;
  };

  const reqRetryMulti = () => {
    // const selectedList = JSON.parse(JSON.stringify(selectedData));
    const selectedList = distinctList(JSON.parse(JSON.stringify(selectedData)));

    const param = {
      interfaceType: interfaceType,
      selectedList: selectedList
    }

    let valid = { isValid: true, msg: "", count: 0 };
    selectedList.forEach(o => {
      const tmp = o.interface_id;
      if (o.protocol_cd === null || o.protocol_cd === undefined) {
        valid.isValid = false;
        valid.count = valid.count + 1;
        if (valid.count < 6) {
          valid.msg = valid.msg + "인터페이스ID '" + tmp  + "' 에 해당 하는 PROTOCOL이 존재 하지 않습니다.\n";
        }
      } else {
        // DISTCP는 DISABLED 처리 되어 선택 될 일 없지만 방어로직
        if (o.protocol_cd === 'DISTCP') {
          valid.isValid = false;
          valid.count = valid.count + 1;
          if (valid.count < 6) {
            valid.msg = valid.msg + "DISTCP PROTOCOL은 재처리 불가 하오니 제외 하여 주시기 바랍니다.\n";
          }
        }
        if (o.interface_cycle === 'OD') {
          valid.isValid = false;
          valid.count = valid.count + 1;
          if (valid.count < 6) {
            valid.msg = valid.msg + "수집 주기가 On-demand(OD)인 경우 재처리 불가 하오니 제외 하여 주시기 바랍니다.\n";
          }
        }
      }
    });
    if (!valid.isValid) {
      if (valid.count > 5) {
        valid.msg = valid.msg + "\n(최대 5건만 출력 됩니다.)"
      }
      const msg = "다음과 같은 사유로 재처리 작업을 취소 합니다.\n" + valid.msg;
      alert(msg);
      return;
    };

    requestCollectRetry(param)
      .then(response => response.data)
      .then((ret) => {
        if (ret !== undefined) {
          if (ret.rs !== undefined) return;
        }
      });
  };

  const getGridCurrApi = (resGridCurrApi) => {
    gridCurrApiRef.current = resGridCurrApi;
  };
  
  const refreshRow = (rowIndex, newRowData) => { // eslint-disable-line no-unused-vars
    let rows = [];
    let row = gridCurrApiRef.current.getDisplayedRowAtIndex(rowIndex);
    let data = JSON.parse(JSON.stringify(row.data));

    if (newRowData.retry_desc !== undefined) data.retry_desc = newRowData.retry_desc;
    if (newRowData.retry_count !== undefined) data.retry_count = newRowData.retry_count;
    if (newRowData.last_started_by !== undefined) data.last_started_by = newRowData.last_started_by;

    if (newRowData.collected_at !== undefined) data.collected_at = newRowData.collected_at;
    if (newRowData.collect_source_seq !== undefined) data.collect_source_seq = newRowData.collect_source_seq;
    
    if (newRowData.started_at !== undefined) data.started_at = newRowData.started_at;
    if (newRowData.ended_at !== undefined) data.ended_at = newRowData.ended_at;
    if (newRowData.file_size !== undefined) data.file_size = newRowData.file_size;
    if (newRowData.task_log_url !== undefined) data.task_log_url = newRowData.task_log_url;
    if (newRowData.status_nm !== undefined) data.status_nm = newRowData.status_nm;
    if (newRowData.err_msg !== undefined) data.err_msg = newRowData.err_msg;
    if (newRowData.retry !== undefined) data.retry = newRowData.retry;

    if (newRowData.interface_id !== undefined) data.interface_id = newRowData.interface_id;
    if (newRowData.local_path !== undefined) data.local_path = newRowData.local_path;
    if (newRowData.dest_path !== undefined) data.dest_path = newRowData.dest_path;
    if (newRowData.filenm !== undefined) data.filenm = newRowData.filenm;
    
    if (newRowData.host_nm !== undefined) data.host_nm = newRowData.host_nm;
    if (newRowData.task_log_url !== undefined) data.task_log_url = newRowData.task_log_url;
    if (newRowData.target_dt !== undefined) data.target_dt = newRowData.target_dt;

    if (newRowData.status_cd !== undefined) data.status_cd = newRowData.status_cd;
    if (newRowData.status_nm !== undefined) data.status_nm = newRowData.status_nm;
    if (newRowData.description !== undefined) data.description = newRowData.description;

    if (newRowData.sync_id !== undefined) data.sync_id = newRowData.sync_id;

    row.data = data;
    rows.push(row);
    gridCurrApiRef.current.redrawRows({ rowNodes: rows });
  };
  
  const receiveListSync = (receiveList) => {
    const tmpReceiveList = JSON.parse(JSON.stringify(receiveList));

    if (tmpReceiveList === undefined || tmpReceiveList.length <= 0) return;
    if (historyDataRef.current === undefined || historyDataRef.current.length <= 0) return;

    setTimeout(() => {
      let isUpdateTargetPopupOpened = false;
      let popIdx = -1;

      tmpReceiveList.forEach(o => {
        gridCurrApiRef.current.forEachNodeAfterFilterAndSort((rowNode, index) => {
          if (rowNode.data.collect_hist_id === o.collect_hist_id && rowNode.data.sync_id !== o.sync_id) {
            if (selectedHistIdRef.current === o.collect_hist_id) {
              isUpdateTargetPopupOpened = true;
              popIdx = index;
            }
            refreshRow(index, o);
          }
        });
      });

      if (isUpdateTargetPopupOpened && popupIsShowRef.current) {
        // # popup (상세 또는 재처리) Open 상태 일 경우 POPUP DATA 갱신 처리
        // 1) 갱신 DATA 전달이 용이하지 않아 불가피하게 close popup 후 open popup 처리.
        // 2) popup close -> open 처리는 setTimeout과 동반 처리 되어야 하며, 깜빡거리는 부분이 있어 보기 좋지 않고 거슬림.
        //    popupSlice 에 action 및 관련 sate 추가 하여 처리
        //    action :: popupReload
        //    state :: reloadEffectIdx => (화면 갱신 반응용 IDX)
        //          :: popupProps => (추가 필요 DATA / 필요 할 경우)

        selectedHistIdRef.current = selectedHistDataRef.current.collect_hist_id

        if (selectedOpenPopupRef.current === "openPopupHistoryRetry") {
          dispatch(reloadPopup());
        } else if (selectedOpenPopupRef.current === "openPopupHistoryDetail") {
          if (popIdx > - 1) {
            selectedHistDataRef.current = gridCurrApiRef.current.getDisplayedRowAtIndex(popIdx)?.data;
            const params = {
              popupProps: { historyMainData: selectedHistDataRef.current }
            };
            dispatch(reloadPopup(params));
          }
        }
      }
    }, 100);
  };

  

  // ------------------------------------------------------------------------------------------------------
  // SSE Management
  const eventSourceRef = useRef();
  const reconnectFrequencySecondRef = useRef(1);
  const setupEventSource = useCallback(() => {
    console.log("[sse] setupEventSource ");
    eventSourceRef.current = new EventSource("/dgw_service/sse/subscribe");
    eventSourceRef.current.addEventListener(interfaceType, (ret) => {
      const receiveData = JSON.parse(ret.data);
      // BackEnd SSE 초기화 Message :: receiveData === "OK" OR receiveData === "200"
      if (receiveData !== "OK" && receiveData !== "200") {
        if (receiveData.length > 0) {
          let slog = "================================\n";
          receiveData.forEach((v) => {
            if (v.collect_hist_id !== null) {
              slog = slog + "histId : " + v.collect_hist_id + ",";
              slog = slog + "ended_at : " + v.ended_at + "\n";
            } else {
              // provide
            }
          });
          slog = slog + "================================\n";
          console.log(slog);
          receiveListSync(receiveData);
        }
      }
    });
    eventSourceRef.current.onopen = (e) => {
      console.log("[sse] open ");
      reconnectFrequencySecondRef.current = 1;
    };
    eventSourceRef.current.onerror = (e) => {
      console.log("[sse] on error ");
      eventSourceRef.current.close();
      console.log("[sse] current Close ");
      reConnectFunc();
    };
    return () => {
      console.log("[sse] close && unmount ");
      eventSourceRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isFunction = (functionToCheck) => {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
  };
  const debounce = (func, wait) => {
    let timeout;
    let waitFunc;

    return function() {
      console.log("[sse] debounce ");
      if (isFunction(wait)) {
        waitFunc = wait;
      } else {
        waitFunc = function() { 
          return wait;
        };
      }
      const later = () => {
        console.log("[sse] call later() ");
        timeout = null;
        func.apply();
      };
      clearTimeout(timeout);
      console.log("[sse] wait Second :: ", waitFunc());
      timeout = setTimeout(later, waitFunc());
    };
  };

  const reConnectFunc = debounce(function() {
      setupEventSource();
      reconnectFrequencySecondRef.current *= 2;
      console.log("[sse] reconnectFreq :: ", reconnectFrequencySecondRef.current);
      if (reconnectFrequencySecondRef.current >= 64) reconnectFrequencySecondRef.current = 64;
    }, function() {
      console.log("[sse] reconnectFreq X 1000 :: ", reconnectFrequencySecondRef.current * 1000);
      return reconnectFrequencySecondRef.current * 1000
    }
  );
  // SSE Management
  // ------------------------------------------------------------------------------------------------------
  
  const onCellDoubleClicked = (e) => {
    const field = e.colDef.field;
    if (field === 'retry_desc' || field === 'task_log_url') return;
    if (field === 'last_started_by' || field === 'retry_count') {
      // 재처리 History Popup
      selectedHistIdRef.current = e.data.collect_hist_id;
      selectedHistDataRef.current = e.data;
      selectedOpenPopupRef.current = "openPopupHistoryRetry";
      setTimeout(() => {
        openPopupHistoryRetry(selectedHistIdRef.current);
      }, 100);
    } else {
      // Collect History Popup
      selectedHistIdRef.current = e.data.collect_hist_id;
      selectedHistDataRef.current = e.data;
      selectedOpenPopupRef.current = "openPopupHistoryDetail";
      setTimeout(() => {
        openPopupHistoryDetail(selectedHistDataRef.current);
      }, 100);
    }
  }
    
  const openPopupHistoryDetail = (rowData) => {
    const popupParams = {
      popupComp: <PopupHistoryDetail interfaceType={ interfaceType } historyMainData = { rowData } userInfo = { userInfo } isShowHistIdColumn = { isShowHistIdColumn } /* callbackFun = { callbackPopupHistory } */ />,
      title: '수집 이력 상세',
      style: {
        top: 'calc(50% - 330px)',
        left: 'calc(50% - 700px)',
        height: '660px',
        width: '1400px'
      }
    };
    dispatch(openPopup(popupParams));
  }

  const openPopupHistoryRetry = ( histId ) => {
    const popupParams = {
      popupComp: <PopupHistoryRetry  interfaceType={ interfaceType } histId = { histId } userInfo = { userInfo } isShowHistIdColumn = { isShowHistIdColumn } callbackFun = { callbackPopupHistory } />,
      title: '재처리 이력 상세',
      style: {
        top: 'calc(50% - 200px)',
        left: 'calc(50% - 700px)',
        height: '400px',
        width: '1400px'
      }
    };
    dispatch(openPopup(popupParams));
  };

  const callbackPopupHistory = (ret) => {};

  const calcColsDefs = () => {
    const tmp = JSON.parse(JSON.stringify(currColumnDefs));
    const gridWidth = divGridRef.current?.offsetWidth || 0;

    // hidden col
    tmp.forEach(e => {
      if (e?.children !== undefined) {
        e?.children.forEach(item => {
          if (item?.field === 'collect_hist_id') item.hide = !isShowHistIdColumn;
          if (item?.field === 'err_msg') item.hide =  !isShowErrMsgColumn;
          if (item?.field === 'system_nm' || item?.field === 'interface_nm' || item?.field === 'protocol_cd' || item?.field === 'interface_cycle_nm') item.hide =  !isShowInterfaceInfoColumn;
          if (item?.field === 'task_log_url') item.hide = (userInfo.admin_lv !== '1');
          if (item?.field === 'provide_interface_id' || item?.field === 'provide_interface_nm' || item?.field === 'provide_protocol_cd' || item?.field === 'provide_detail_desc' ||
            item?.field === 'provide_db' || item?.field === 'provide_tb' || item?.field === 'provide_run_by' || item?.field === 'provide_provided_to') item.hide =  !isShowProvideInfoColumn;
        });
      }
    });

    // other cols width
    let defColsWidth = 0;
    tmp.forEach(e => {
      if (e?.children === undefined) {
        defColsWidth = defColsWidth + (e?.width === undefined ? 0 : e.width);
      } else {
        e?.children.forEach(item => {
          const hide = item?.hide === undefined ? false : item?.hide;
          if (!hide && item?.field !== 'local_path' && item?.field !== 'dest_path') {
            defColsWidth = defColsWidth + (item?.width === undefined ? 0 : item.width);
          }
        });
      }
    });

    // add cell renderer
    tmp.forEach(e => {
      if (e?.children !== undefined) {
        e?.children.forEach(item => {
          if (item?.field === 'status_nm') item.cellRenderer = (props) => statusCellRender(interfaceType, props);
          if (item?.field === 'task_log_url') item.cellRenderer = agGridLinkRender;
          if (item?.field === 'retry_desc') item.cellRenderer = (props) => gridRetryBtnRender(props, confirm, alert, interfaceType, actionAuth);
        });
      }
    });

    let pathWidth = 0;
    pathWidth = ((gridWidth - defColsWidth) / 2) - 20;
    console.log('pathWidth : ', pathWidth);
    if (pathWidth < 100) pathWidth = 100;
    tmp.forEach(e => {
      if (e?.children !== undefined) {
        e?.children.forEach(item => {
          if (item?.field === 'local_path' || item?.field === 'dest_path') {
            item.width = pathWidth;
          }
        });
      }
    });

    setCurrColumnDefs(tmp);
  };

  useEffect(() => {
    setupEventSource();
    return () => {
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    historyDataRef.current = JSON.parse(JSON.stringify(historyData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyData]);

  useEffect(() => {
    popupIsShowRef.current = isShow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShow]);

  useEffect(() => {
    setTimeout(() => {
      calcColsDefs();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interfaceType, isShowInterfaceInfoColumn, isShowHistIdColumn, isShowErrMsgColumn, isShowProvideInfoColumn]);

  useEffect(() => {
    setTimeout(() => {
      calcColsDefs();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  useEffect(() => {
    setColumnDefs(currColumnDefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currColumnDefs]);

  return (
    <div className="mu-col mu-col-12">
      <div className="section-float-right" style={{ position: "absolute", right: "150px", marginTop: "13px" }} >
        {
        (userInfo.admin_lv === '1') &&
        <div className="mu-item-group" style={{marginLeft: '4px', marginRight: '2px'}}>
          <ButtonToggleColShowHidden
            key="toggleHistIdShowHidden"
            label="이력 ID 컬럼" 
            isToggleOn={ isShowHistIdColumn }
            setIsToggleOn={ setIsShowHistIdColumn }
            tooltipNextOn="이력 ID 컬럼 보기"
            tooltipNextOff="이력 ID 컬럼 감추기"
          />
        </div>
        }
        <div className="mu-item-group" style={{marginLeft: '4px', marginRight: '2px'}}>
          <ButtonToggleColShowHidden
            key="toggleErrMsgShowHidden"
            label="Error Message 컬럼"
            isToggleOn={ isShowErrMsgColumn }
            setIsToggleOn={ setIsShowErrMsgColumn }
            tooltipNextOn="Error Message 컬럼 보기"
            tooltipNextOff="Error Message 컬럼 감추기"
          />
        </div>
        <div className="mu-item-group" style={{marginLeft: '4px', marginRight: '2px'}}>
          <ButtonToggleColShowHidden
            key="toggleInterfaceInfoShowHidden"
            label={ "수집 정보 상세 컬럼" }
            isToggleOn={ isShowInterfaceInfoColumn }
            setIsToggleOn={ setIsShowInterfaceInfoColumn }
            tooltipNextOn={ "수집 정보 상세 컬럼 보기" }
            tooltipNextOff={ "수집 정보 상세 컬럼 감추기" }
          />
        </div>
        <div className="mu-item-group" style={{marginLeft: '4px', marginRight: '2px'}}>
          <ButtonToggleColShowHidden
            key="toggleProvideInfoShowHidden"
            label={ "제공 정보 컬럼" }
            isToggleOn={ isShowProvideInfoColumn }
            setIsToggleOn={ setIsShowProvideInfoColumn }
            tooltipNextOn={ "제공 정보 컬럼 보기" }
            tooltipNextOff={ "제공 정보 컬럼 감추기" }
          />
        </div>
      </div>
      {/* 재처리 button */}
      <div className="section-float-right">
        <div className="mu-search-group mu-more-item">
          <div className="mu-item-group">
            <div className="mu-search-btn">
              <ButtonMuiStd color = 'blue' icon = 'apply' label = '다중재처리' width={'120px'} style={{ fontWeight: 'bold' }} disabled={ !actionAuth.write } onClick={ confirmRetry } />
            </div>
          </div>
        </div>
      </div>
      {/* <!-- --> */}
      <div className="mu-col mu-col-12" ref={ divGridRef }>
        <GridPage
          /* 기본 */
          columnDefs={ columnDefs }
          data={ historyData }
          style={{ height: `calc(100vh - 350px)`, width: "100%" }}
          /* 기본 */
          /* PAGING */
          usePagination={ usePagination }
          searchType={ searchType }
          pagePerCount = { pagePerCount }
          setPagePerCount = { setPagePerCount }
          onClickPageBtn={ onClickPageBtn }
          /* PAGING */
          /* SELECT */
          // isRowSelectable : 선택 CheckBox가 있을때만 true로 할것. 아니면 오류 발생
          isRowSelectable = { isRowSelectable }
          // getSelectedData={ getSelectedData }
          setSelectedData = { setSelectedData }
          /* SELECT */
          /* API */
          getGridCurrApi={ getGridCurrApi }
          /* API */
          /* EVENT */
          onCellDoubleClicked = { onCellDoubleClicked }
          /* EVENT */
          useContextMenu = { true }
        />
      </div>
    </div>
  )
};

export default HistoryGrid;