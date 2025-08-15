import L from 'leaflet';
import type { 
  GeoLocation, 
  MeasureResult, 
  MeasureToolType, 
  MapLayerType,
  Terminal,
  TerminalType 
} from '@/types';

// 地图工具服务类
class MapToolsService {
  private map: L.Map | null = null;
  private measureControl: any = null;
  private drawingLayer: L.LayerGroup | null = null;
  private currentMeasureType: MeasureToolType = 'none';
  private baseLayers: Record<MapLayerType, L.TileLayer> = {} as any;
  private terminalMarkers: Map<string, L.Marker> = new Map();

  // 初始化地图
  initMap(containerId: string, center: GeoLocation, zoom: number = 12): L.Map {
    // 创建地图实例
    this.map = L.map(containerId, {
      zoomControl: false,
      attributionControl: true
    }).setView([center.latitude, center.longitude], zoom);

    // 初始化图层
    this.initBaseLayers();
    
    // 添加默认图层
    this.baseLayers.street.addTo(this.map);

    // 添加缩放控件到右下角
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    // 添加比例尺控件
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false
    }).addTo(this.map);

    // 初始化绘图图层
    this.drawingLayer = L.layerGroup().addTo(this.map);

    return this.map;
  }

  // 初始化基础图层
  private initBaseLayers() {
    this.baseLayers = {
      street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 19
      }),
      terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors',
        maxZoom: 17
      }),
      hybrid: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 19
      })
    };
  }

  // 切换图层
  switchLayer(layerType: MapLayerType) {
    if (!this.map) return;

    // 移除当前图层
    Object.values(this.baseLayers).forEach(layer => {
      this.map!.removeLayer(layer);
    });

    // 添加新图层
    this.baseLayers[layerType].addTo(this.map);

    // 如果是混合图层，添加标签图层
    if (layerType === 'hybrid') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
      }).addTo(this.map);
    }
  }

  // 创建终端图标
  createTerminalIcon(type: TerminalType, isSelected: boolean = false, status: string = 'online'): L.DivIcon {
    const typeConfig = {
      monitor: { color: '#67C23A', symbol: '📹' },
      drone: { color: '#409EFF', symbol: '🚁' },
      soldier: { color: '#E6A23C', symbol: '👤' },
      handheld: { color: '#F56C6C', symbol: '📱' }
    };

    const config = typeConfig[type];
    const size = isSelected ? 32 : 24;
    const opacity = status === 'offline' ? 0.5 : 1;

    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${config.color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.5}px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          opacity: ${opacity};
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
          cursor: pointer;
        ">
          ${config.symbol}
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        </style>
      `,
      className: 'terminal-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  // 添加终端标记
  addTerminalMarker(terminal: Terminal, isSelected: boolean = false): L.Marker {
    if (!this.map) throw new Error('Map not initialized');

    const marker = L.marker(
      [terminal.location.latitude, terminal.location.longitude],
      {
        icon: this.createTerminalIcon(terminal.type, isSelected, terminal.status)
      }
    ).addTo(this.map);

    // 创建弹窗内容
    const popupContent = this.createTerminalPopupContent(terminal);
    marker.bindPopup(popupContent);

    // 存储标记
    this.terminalMarkers.set(terminal.id, marker);

    return marker;
  }

  // 创建终端弹窗内容
  private createTerminalPopupContent(terminal: Terminal): string {
    const typeLabels = {
      monitor: '监控设备',
      drone: '无人机',
      soldier: '单兵设备',
      handheld: '手持终端'
    };

    const statusLabels = {
      online: '在线',
      offline: '离线',
      warning: '告警',
      emergency: '紧急'
    };

    return `
      <div style="text-align: center; min-width: 200px;">
        <h4 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">${terminal.name}</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">类型:</span>
            <span style="color: #333; font-weight: 500;">${typeLabels[terminal.type]}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">状态:</span>
            <span style="color: ${terminal.status === 'online' ? '#67C23A' : terminal.status === 'offline' ? '#F56C6C' : '#E6A23C'}; font-weight: 500;">
              ${statusLabels[terminal.status]}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">位置:</span>
            <span style="color: #333;">${terminal.location.latitude.toFixed(4)}, ${terminal.location.longitude.toFixed(4)}</span>
          </div>
          ${terminal.batteryLevel !== undefined ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">电量:</span>
            <span style="color: ${terminal.batteryLevel > 30 ? '#67C23A' : terminal.batteryLevel > 15 ? '#E6A23C' : '#F56C6C'}; font-weight: 500;">
              ${terminal.batteryLevel}%
            </span>
          </div>
          ` : ''}
          ${terminal.speed !== undefined ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">速度:</span>
            <span style="color: #333;">${terminal.speed.toFixed(1)} km/h</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">更新:</span>
            <span style="color: #333;">${this.formatTime(terminal.lastUpdate)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // 格式化时间
  private formatTime(time: Date): string {
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
    return time.toLocaleDateString();
  }

  // 更新终端标记
  updateTerminalMarker(terminal: Terminal, isSelected: boolean = false) {
    const marker = this.terminalMarkers.get(terminal.id);
    if (marker) {
      // 更新位置
      marker.setLatLng([terminal.location.latitude, terminal.location.longitude]);
      
      // 更新图标
      marker.setIcon(this.createTerminalIcon(terminal.type, isSelected, terminal.status));
      
      // 更新弹窗内容
      marker.setPopupContent(this.createTerminalPopupContent(terminal));
    }
  }

  // 移除终端标记
  removeTerminalMarker(terminalId: string) {
    const marker = this.terminalMarkers.get(terminalId);
    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.terminalMarkers.delete(terminalId);
    }
  }

  // 清除所有终端标记
  clearAllTerminalMarkers() {
    if (this.map) {
      this.terminalMarkers.forEach(marker => {
        this.map!.removeLayer(marker);
      });
      this.terminalMarkers.clear();
    }
  }

  // 定位到指定位置
  flyTo(location: GeoLocation, zoom?: number) {
    if (this.map) {
      this.map.flyTo([location.latitude, location.longitude], zoom || this.map.getZoom());
    }
  }

  // 适应所有标记的视图
  fitBounds(locations: GeoLocation[], padding: number = 20) {
    if (this.map && locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude])
      );
      this.map.fitBounds(bounds, { padding: [padding, padding] });
    }
  }

  // 开始测距
  startDistanceMeasure(): void {
    this.currentMeasureType = 'distance';
    this.clearMeasurements();
    
    if (!this.map) return;

    // 这里可以集成专门的测距库，如 leaflet-measure
    // 目前提供基础实现
    let points: L.LatLng[] = [];
    let polyline: L.Polyline | null = null;
    let totalDistance = 0;

    const onMapClick = (e: L.LeafletMouseEvent) => {
      points.push(e.latlng);
      
      if (points.length === 1) {
        // 第一个点，添加起点标记
        L.marker(e.latlng).addTo(this.drawingLayer!);
      } else {
        // 计算距离
        const lastPoint = points[points.length - 2];
        const distance = lastPoint.distanceTo(e.latlng);
        totalDistance += distance;
        
        // 更新或创建折线
        if (polyline) {
          polyline.setLatLngs(points);
        } else {
          polyline = L.polyline(points, { color: '#ff0000', weight: 3 }).addTo(this.drawingLayer!);
        }
        
        // 添加距离标签
        const midPoint = L.latLng(
          (lastPoint.lat + e.latlng.lat) / 2,
          (lastPoint.lng + e.latlng.lng) / 2
        );
        
        L.marker(midPoint, {
          icon: L.divIcon({
            html: `<div style="background: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; border: 1px solid #ccc;">
              ${(distance / 1000).toFixed(2)} km
            </div>`,
            className: 'distance-label'
          })
        }).addTo(this.drawingLayer!);
      }
    };

    this.map.on('click', onMapClick);
  }

  // 开始测面积
  startAreaMeasure(): void {
    this.currentMeasureType = 'area';
    this.clearMeasurements();
    
    // 面积测量的实现
    // 这里可以集成专门的测面积库
  }

  // 停止测量
  stopMeasure(): void {
    this.currentMeasureType = 'none';
    if (this.map) {
      this.map.off('click');
    }
  }

  // 清除测量结果
  clearMeasurements(): void {
    if (this.drawingLayer) {
      this.drawingLayer.clearLayers();
    }
  }

  // 获取地图实例
  getMap(): L.Map | null {
    return this.map;
  }

  // 销毁地图
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.terminalMarkers.clear();
    this.drawingLayer = null;
  }
}

// 创建单例实例
export const mapToolsService = new MapToolsService();
export default mapToolsService;
