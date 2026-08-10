import { IndexBar, Popup, Toast } from "antd-mobile";
import { CloseOutline, EnvironmentOutline } from "antd-mobile-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  HOT_CITIES,
  SUPPORTED_CITIES,
  type CityOption,
} from "@/constants/cities";
import { useAppStore } from "@/stores/useAppStore";
import styles from "./index.module.less";

interface CityPickerProps {
  visible: boolean;
  onClose: () => void;
}

const CityPicker: React.FC<CityPickerProps> = ({ visible, onClose }) => {
  const city = useAppStore((state) => state.city);
  const locationStatus = useAppStore((state) => state.locationStatus);
  const selectCity = useAppStore((state) => state.selectCity);
  const locateCurrentPosition = useAppStore(
    (state) => state.locateCurrentPosition
  );
  const [attempting, setAttempting] = useState(false);

  // 按拼音首字母分组（A-Z），供 IndexBar 使用。
  const groups = useMemo(() => {
    const map = new Map<string, CityOption[]>();
    for (const option of SUPPORTED_CITIES) {
      const list = map.get(option.letter);
      if (list) list.push(option);
      else map.set(option.letter, [option]);
    }
    return Array.from(map.entries())
      .map(([letter, cities]) => ({ letter, cities }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  }, []);

  // 面板关闭时复位定位尝试，避免下次打开误提示。
  useEffect(() => {
    if (!visible) setAttempting(false);
  }, [visible]);

  // 仅在用户主动点了「重新定位」后，对定位结果做一次反馈。
  useEffect(() => {
    if (!attempting) return;
    if (locationStatus === "locating" || locationStatus === "idle") return;
    setAttempting(false);
    if (locationStatus === "located") {
      Toast.show({ content: `已定位到 ${city}` });
      onClose();
    } else if (locationStatus === "denied") {
      Toast.show({ content: "浏览器拒绝了定位权限" });
    } else if (locationStatus === "unsupported") {
      Toast.show({ content: "当前浏览器不支持定位" });
    } else {
      Toast.show({ content: "定位失败，请稍后重试" });
    }
  }, [attempting, locationStatus, city, onClose]);

  const handleLocate = () => {
    if (locationStatus === "locating") return;
    setAttempting(true);
    locateCurrentPosition();
  };

  const renderCity = (option: CityOption) => (
    <button
      key={option.name}
      type="button"
      className={`${styles.cityCell} ${
        city === option.name ? styles.active : ""
      }`}
      onClick={() => {
        selectCity(option);
        onClose();
      }}
    >
      {option.name}
    </button>
  );

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyClassName={styles.pickerBody}
    >
      <div className={styles.picker}>
        <div className={styles.pickerHeader}>
          <strong>选择城市</strong>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutline />
          </button>
        </div>

        <button
          type="button"
          className={styles.locateButton}
          disabled={locationStatus === "locating"}
          onClick={handleLocate}
        >
          <EnvironmentOutline />
          <span>{locationStatus === "locating" ? "定位中..." : "重新定位"}</span>
        </button>

        <div className={styles.hotRow}>
          <span className={styles.hotLabel}>热门城市</span>
          <div className={styles.hotGrid}>{HOT_CITIES.map(renderCity)}</div>
        </div>

        <div className={styles.listArea}>
          <IndexBar>
            {groups.map((group) => (
              <IndexBar.Panel
                key={group.letter}
                index={group.letter}
                title={group.letter}
              >
                <div className={styles.groupCities}>
                  {group.cities.map(renderCity)}
                </div>
              </IndexBar.Panel>
            ))}
          </IndexBar>
        </div>
      </div>
    </Popup>
  );
};

export default CityPicker;
